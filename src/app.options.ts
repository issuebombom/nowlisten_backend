import { NestApplicationOptions, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  const colorize = env !== 'prod';

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
                    colors: colorize,
                    prettyPrint: true,
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
