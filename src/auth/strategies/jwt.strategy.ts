import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtTokenPayload } from '../services/auth.service';
import { IJwtUserProfile } from '../interfaces/auth-guard-user.interface';
import { RefreshTokenService } from '../services/refresh-token.service';
import { UserService } from '../services/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtTokenPayload): Promise<IJwtUserProfile> {
    // getUserById에서 유저 존재 확인
    await this.userService.getUserById(payload.sub);

    // passport는 아래 반환 값을 req.user에 자동으로 첨부
    return { userId: payload.sub, iat: payload.iat, jti: payload.jti };
  }
}
