import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtTokenPayload } from '../services/auth.service';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
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
    const found = await this.refreshTokenService.hasToken(payload.jti);
    const user = await this.userService.getUserById(payload.sub);
    if (!found || !user) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `token not exists: ${payload.jti}`,
        `token not exists`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    // passport는 아래 반환 값을 req.user에 자동으로 첨부
    return { userId: payload.sub, iat: payload.iat, jti: payload.jti };
  }
}
