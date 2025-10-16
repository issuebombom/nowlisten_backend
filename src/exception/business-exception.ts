import { HttpStatus } from '@nestjs/common';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { genId } from 'src/common/utils/gen-id.util';

export class BusinessException extends Error {
  public readonly id: string;
  public readonly timestamp: Date;

  constructor(
    public readonly domain: ErrorDomain,
    public readonly message: string, // 내부 로깅용 메시지
    public readonly apiMessage: string, // api용 메시지
    public readonly status: HttpStatus,
    public readonly context?: string[], // ex) validation error
  ) {
    super(message);
    this.id = genId(12);
    this.timestamp = new Date();
  }
}
