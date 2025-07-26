import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessException } from 'src/exception/business-exception';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { ErrorDomain } from 'src/common/types/error-domain.type';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err instanceof BusinessException) {
      throw err;
    }

    if (info instanceof TokenExpiredError) {
      throw new BusinessException(
        ErrorDomain.Auth,
        'token expired',
        'token has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (info instanceof JsonWebTokenError) {
      throw new BusinessException(
        ErrorDomain.Auth,
        'token invalid',
        'invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    return user;
  }
}
