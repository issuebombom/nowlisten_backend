import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  corsOptions,
  getNestOptions,
  GlobalValidationPipe,
} from './app.options';
import { ConfigService } from '@nestjs/config';
import { setSwagger } from './app.swagger';
import { BusinessExceptionFilter } from './exception/business-exception.filter';
import { ClassSerializerInterceptor } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, getNestOptions()); // winston 로깅 옵션 추가

  const configService = app.get(ConfigService);
  const env = configService.get<string>('ENV');
  const port = configService.get<string>('PORT');
  const serviceName = configService.get<string>('SERVICE_NAME');

  app.enableCors(corsOptions(env));
  app.useGlobalFilters(new BusinessExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(GlobalValidationPipe.build());
  app.setGlobalPrefix('api/v1');
  setSwagger(app);

  console.log(`env: ${env}\t port: ${port}\t service name: ${serviceName}`);
  await app.listen(port);
}
bootstrap();
