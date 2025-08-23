import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { BusinessException } from 'src/exception/business-exception';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    // passport에 의해 error 쿼리스트링이 콜백에 포함될 경우
    const { error } = req.query;
    if (error && typeof error === 'string') {
      // 유저의 승인 거부
      if (error.includes('access_denied')) {
        throw new BusinessException(
          ErrorDomain.Auth,
          'access denied',
          'access denied',
          HttpStatus.FORBIDDEN,
        );
      } else {
        throw new BusinessException(
          ErrorDomain.Auth,
          error,
          error,
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    // TODO: 그 외 에러에 대한 목록 확인 및 분기 생성 필요
    // https://developers.google.com/identity/protocols/oauth2/web-server?utm_source=chatgpt.com&hl=ko#node.js

    // 기타 google 내부 문제 발생 시 예외처리
    if (err || !user) {
      const message =
        err?.message || info?.message || 'Unknown error during Google OAuth';
      throw new BusinessException(
        ErrorDomain.Auth,
        `google oauth error: ${message}`,
        `google oauth error: ${message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return user;
  }
}
