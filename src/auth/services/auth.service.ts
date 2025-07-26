import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { ConfigService } from '@nestjs/config';
import { LoginReqDto } from '../dto/login-req.dto';
import { User } from '../entities/user.entity';

import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginResDto } from '../dto/login-res.dto';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshResDto } from '../dto/refresh-res.dto';

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
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(dto: LoginReqDto): Promise<LoginResDto> {
    const user = await this.userService.getUserByEmailWithPassword(dto.email);
    const verified = await argon2.verify(user.password, dto.password);
    if (!verified) {
      throw new BusinessException(
        ErrorDomain.Auth,
        'invalid credentials',
        'invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }

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

  refresh(userId: string): RefreshResDto {
    const accessPayload = this.createJwtTokenPayload(userId);
    const access = this.createAccessToken(accessPayload);
    return { access };
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
