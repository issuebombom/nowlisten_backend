import { Logger, NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractLogger, QueryRunner, LogLevel, LogMessage } from 'typeorm';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import winston from 'winston';

// type
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { validationExceptionFilter } from './exception/validation-exception.filter';

export function getNestOptions(): NestApplicationOptions {
  const configService = new ConfigService();
  const env = configService.get<string>('ENV');
  const serviceName = configService.get<string>('SERVICE_NAME');

  return {
    abortOnError: true,
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          level: env === 'prod' ? 'info' : 'silly',
          format:
            env === 'local'
              ? winston.format.combine(
                  winston.format.timestamp(),
                  nestWinstonModuleUtilities.format.nestLike(serviceName, {
                    colors: true,
                    prettyPrint: false,
                  }),
                )
              : null,
        }),
      ],
    }),
  };
}

// CORS OPTIONS
export const corsOptions = (env: string): CorsOptions => {
  const whitelist = allowedOrigins[env] || [];

  return {
    origin: (requestOrigin, callback) => {
      if (
        !requestOrigin || // allow postman, same-origin etc.
        whitelist.includes(requestOrigin) ||
        checkLocalWhiteList(env, requestOrigin)
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  };
};

// ! NOTE: env로 추가 제거 가능하도록 설정 필요
const allowedOrigins = {
  test: [],
  prod: [],
};

const checkLocalWhiteList = (env: string, requestOrigin: string) => {
  return (
    env === 'local' &&
    (requestOrigin.includes('http://127.0.0.1') ||
      requestOrigin.includes('http://localhost'))
  );
};

// Global Validation Pipe
export class GlobalValidationPipe {
  static build(): ValidationPipe {
    return new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFilter,
    });
  }
}

// TypeORM query custum logger
export class CustomQueryLogger extends AbstractLogger {
  constructor(private readonly logger = new Logger('TypeOrmQuery')) {
    super();
  }

  logQuery(query: string): void {
    this.writeLog('query', {
      type: 'query',
      message: `\n${query}\n`,
      format: 'sql', // 포맷을 명시하지 않을 경우 sql pretty가 적용 안됨
    });
  }

  logQueryError(error: string, query: string): void {
    this.writeLog('error', {
      type: 'query-error',
      message: `${error.toString().split(': ')[1]}\n${query}}\n`,
    });
  }

  logQuerySlow(time: number, query: string): void {
    this.writeLog('warn', {
      type: 'query-slow',
      message: `\n${query} [${time} ms]\n`,
      format: 'sql', // 포맷을 명시하지 않을 경우 sql pretty가 적용 안됨
    });
  }

  // logSchemaBuild(message: string, queryRunner?: QueryRunner): void {}
  // logMigration(message: string, queryRunner?: QueryRunner): void {}

  protected writeLog(
    level: LogLevel,
    logMessage: LogMessage | LogMessage[],
    queryRunner?: QueryRunner,
  ) {
    const messages = this.prepareLogMessages(
      logMessage,
      {
        highlightSql: true,
        formatSql: false,
      },
      queryRunner,
    );
    for (const message of messages) {
      switch (message.type ?? level) {
        case 'query':
          this.logger.log(message.message, 'Query');
          break;
        case 'query-error':
          this.logger.error(message.message, null, 'QueryError');
          break;
        case 'query-slow':
          this.logger.warn(message.message, `SlowQuery`);
          break;
        // case 'schema-build':
        // case 'migration':
        // case 'info':
        // case 'error':
        // case 'warn':
        default:
          this.logger.log(message.message, 'Query');
      }
    }
  }
}
