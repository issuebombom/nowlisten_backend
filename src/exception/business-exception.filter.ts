import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { BusinessException } from './business-exception';
import omit from 'lodash/omit';

interface ErrorResponseBody extends Omit<BusinessException, 'name'> {}

@Catch(Error)
export class BusinessExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BusinessException.name);

  catch(exception: Error, host: ArgumentsHost) {
    let errorResponseBody: ErrorResponseBody;
    let status: HttpStatus;

    if (exception instanceof BusinessException) {
      status = exception.status;
      errorResponseBody = {
        id: exception.id,
        domain: exception.domain,
        message: exception.message,
        apiMessage: exception.apiMessage,
        details: exception.details,
        status: exception.status,
        timestamp: exception.timestamp,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorResponseBody = new BusinessException(
        ErrorDomain.Generic,
        exception.message,
        exception.message,
        exception.getStatus(),
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponseBody = new BusinessException(
        ErrorDomain.Generic,
        `Internal server error: ${exception.message}`,
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // logging
    this.logger.error(
      `exception: ${JSON.stringify(
        {
          path: request.url,
          ...errorResponseBody,
        },
        null,
        2,
      )}`,
    );

    // client response (message 제외)
    response
      .status(status)
      .json(omit(errorResponseBody, ['id', 'domain', 'message']));
  }
}
