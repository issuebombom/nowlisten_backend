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
import { genCryptoId } from 'src/common/utils/gen-id';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuthResetPasswordEvent } from '../events/auth-reset-password.event';
import { UserRepository } from '../repositories/user.repository';
import { redisKey, RedisNamespace } from 'src/redis/redis-keys';

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

  async googleLogin(profile: ISocialUserProfile) {
    // 우선 구글 로그인에 성공했으니 유저 생성 또는 획득
    const user = await this.userService.createSocialUser(profile);
    const namespace = RedisNamespace.SOCIAL_LOGIN;

    // ! NOTE: 임시 토큰 생성 후 캐시 등록 (추후 레디스로 대체 필요)
    // jwt 전달을 위한 임시토큰 생성
    const tempToken = genCryptoId();
    await this.cacheManager.set(
      redisKey(namespace, tempToken),
      user.id,
      10 * 1000, // 10초
    );

    return { namespace, tempToken };
  }

  async getAccessRefresh(namespace: RedisNamespace, tempToken: string) {
    const key = redisKey(namespace, tempToken);
    const userId = await this.verifyRedisToken(key);

    // 유저 생성완료 및 존재 유무 확인
    const user = await this.userService.getUserById(userId);

    const [accessPayload, refreshPayload] = await Promise.all([
      this.createJwtTokenPayload(user.id),
      this.createJwtTokenPayload(user.id),
    ]);

    const [access, refresh] = await Promise.all([
      this.createAccessToken(accessPayload),
      this.createRefreshToken(refreshPayload, user),
    ]);

    // 캐시 삭제
    this.cacheManager.del(tempToken);

    return { access, refresh };
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
    // 네임스페이스 지정
    const namespace = RedisNamespace.RESET_PASSWORD;
    // 토큰 생성
    const tempToken = genCryptoId();
    // 메모리 저장
    await this.cacheManager.set(
      redisKey(namespace, tempToken),
      user.id,
      5 * 60 * 1000,
    ); // 5분

    // 이벤트 발행
    this.eventEmitter.emitAsync(
      'auth.reset-password',
      new AuthResetPasswordEvent(namespace, tempToken, user.email, user.name),
    );
  }

  async verifyTempToken(namespace: RedisNamespace, token: string) {
    const key = redisKey(namespace, token);
    await this.verifyRedisToken(key);
  }

  async resetPassword(token: string, plainPassword: string): Promise<void> {
    const key = redisKey(RedisNamespace.RESET_PASSWORD, token);
    const userId = await this.verifyRedisToken(key);

    // 유저 검증
    const user = await this.userService.getUserByIdWithPassword(userId);

    // 동일 패스워드 검증
    // TODO: 패스워드 재설정 (사실상 초기화)인데 굳이 이전값과 동일함을 점검할 필요가 있을까?
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

  private async verifyRedisToken(key: string) {
    const value = await this.cacheManager.get<string>(key);

    if (!value) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `redis key ${key} has expired`,
        `token has expired`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
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
