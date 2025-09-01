import { v4 as uuidv4 } from 'uuid';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { ConfigService } from '@nestjs/config';
import { LoginReqDto } from '../dto/login-req.dto';
import { User } from '../entities/user.entity';

import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshResDto } from '../dto/refresh-res.dto';
import {
  IJwtUserProfile,
  ISocialUserProfile,
} from '../interfaces/auth-guard-user.interface';
import { SocialProvider } from 'src/common/types/social-provider.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PasswordService } from './password.service';
import { genId, genCryptoId } from 'src/common/utils/gen-id';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthResetPasswordEvent } from '../events/auth-reset-password.event';
import { UserRepository } from '../repositories/user.repository';

export type JwtToken = {
  access: string;
  refresh: string;
};

export type JwtTokenPayload = {
  sub: string;
  iat: number; // UNIX TIME
  jti: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly refreshTokenService: RefreshTokenService,

    private readonly userRepo: UserRepository,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async login(dto: LoginReqDto): Promise<JwtToken> {
    const user = await this.userService.getUserByEmailWithPassword(dto.email);
    // ! NOTE: 소셜 가입 + 로컬 가입(이중 가입)을 허용할 것인가 말 것인가?
    if (user.provider !== SocialProvider.LOCAL) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `already exists via social login: ${dto.email}`,
        `email ${dto.email} registered with social login. try social login`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.passwordService.varifyPassword(dto.password, user.password);

    const [accessPayload, refreshPayload] = await Promise.all([
      this.createJwtTokenPayload(user.id),
      this.createJwtTokenPayload(user.id),
    ]);

    const [access, refresh] = await Promise.all([
      this.createAccessToken(accessPayload),
      this.createRefreshToken(refreshPayload, user),
    ]);

    return { access, refresh };
  }

  async googleLogin(profile: ISocialUserProfile): Promise<string> {
    // 유저 생성 또는 획득
    const user = await this.userService.createSocialUser(profile);

    // TODO: 토큰 발행을 지금할 필요가 있나?? 세션 검증 후 해도 되잖아
    const [accessPayload, refreshPayload] = await Promise.all([
      this.createJwtTokenPayload(user.id),
      this.createJwtTokenPayload(user.id),
    ]);

    const [access, refresh] = await Promise.all([
      this.createAccessToken(accessPayload),
      this.createRefreshToken(refreshPayload, user),
    ]);

    // ! NOTE: 임시 토큰 생성 후 캐시 등록 (추후 레디스로 대체 필요)
    // TODO: access, refresh를 굳이 레디스에 자리 차지하게 올릴 필요 없잖아
    // - 보안 강화를 위해 crypto 쓰자
    // - sessionId말고 tempToken이라 쓰자
    const sessionId = genId(16);
    await this.cacheManager.set(
      `social-login:${sessionId}`,
      { access, refresh },
      5000,
    );

    return sessionId;
  }

  // TODO: sessionId말고 tempToken으로 쓰자
  async getAccessRefresh(sessionId: string) {
    const value = await this.cacheManager.get<JwtToken>(
      `social-login:${sessionId}`,
    );
    if (!value) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `token has expired`,
        `sessionid ${sessionId} has expired`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // TODO: 검증 후 토큰 생성해도 되잖아

    // 캐시 삭제
    this.cacheManager.del(sessionId);
    return value;
  }

  async refresh(user: IJwtUserProfile): Promise<RefreshResDto> {
    const isTokenExists = await this.refreshTokenService.hasToken(user.jti);
    if (!isTokenExists) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `token has expired`,
        `token has expired`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const accessPayload = this.createJwtTokenPayload(user.userId);
    const access = this.createAccessToken(accessPayload);
    return { access };
  }

  async forgotPassword(email: string): Promise<void> {
    // 유저 조회
    const user = await this.userService.getUserByEmail(email);
    // 토큰 생성
    const tempToken = genCryptoId();
    // 메모리 저장
    await this.cacheManager.set(
      `reset-password:${tempToken}`,
      user.id,
      5 * 60 * 1000,
    ); // 5분

    // 이벤트 발행
    this.eventEmitter.emit(
      'auth.reset-password',
      new AuthResetPasswordEvent(tempToken, user.email, user.name),
    );
  }

  async resetPassword(token: string, plainPassword: string): Promise<void> {
    const userId = await this.cacheManager.get<string>(
      `reset-password:${token}`,
    );

    if (!userId) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `token ${token} has expired`,
        `token has expired`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 유저 검증
    const user = await this.userService.getUserByIdWithPassword(userId);

    // 동일 패스워드 검증
    await this.passwordService.isSamePassword(plainPassword, user.password);

    // 패스워드 변경
    const hashedPassword =
      await this.passwordService.hashedPassword(plainPassword);
    await this.userRepo.updatePassword(userId, hashedPassword);

    // 메모리 삭제
    this.cacheManager.del(`reset-password:${token}`);
  }

  logout(jti: string): void {
    this.refreshTokenService.revokeRefreshToken(jti);
  }

  logoutAllDevices(userId: string): void {
    this.refreshTokenService.revokeAllRefreshTokens(userId);
  }

  private createJwtTokenPayload(userId: string): JwtTokenPayload {
    return {
      sub: userId,
      iat: Math.floor(Date.now() / 1000), // UNIX Time
      jti: uuidv4(),
    };
  }

  private createAccessToken(payload: JwtTokenPayload) {
    const expiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRY');
    const token = this.jwtService.sign(payload, { expiresIn });

    return token;
  }

  private createRefreshToken(payload: JwtTokenPayload, user: User) {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRY');
    const token = this.jwtService.sign(payload, { expiresIn });
    const expiresAt = this.calculateExpiry(expiresIn);

    // DB 저장
    this.refreshTokenService.saveRefreshToken(payload.jti, expiresAt, user);

    return token;
  }

  private calculateExpiry(expiresIn: string): Date {
    const durationTime = parseInt(expiresIn.slice(0, -1), 10);
    const timeFormat = expiresIn.slice(-1);

    let milliseconds: number;

    switch (timeFormat) {
      case 'd':
        milliseconds = durationTime * 24 * 60 * 60 * 1000; // days -> ms
        break;
      case 'h':
        milliseconds = durationTime * 60 * 60 * 1000; // hours -> ms
        break;
      case 'm':
        milliseconds = durationTime * 60 * 1000; // minutes -> ms
        break;
      case 's':
        milliseconds = durationTime * 1000; // seconds -> ms
        break;
      default:
        throw new BusinessException(
          ErrorDomain.Auth,
          `invalid duration string: ${expiresIn}`,
          `invalid duration string: ${expiresIn}`,
          HttpStatus.BAD_REQUEST,
        );
    }
    return new Date(Date.now() + milliseconds);
  }
}
