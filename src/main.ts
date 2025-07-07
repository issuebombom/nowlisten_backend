import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOptions, getNestOptions } from './app.options';
import { ConfigService } from '@nestjs/config';
import { setSwagger } from './app.swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, getNestOptions()); // winston 로깅 옵션을 추가함

  const configService = app.get(ConfigService);
  const env = configService.get<string>('ENV');
  const port = configService.get<string>('PORT');
  const serviceName = configService.get<string>('SERVICE_NAME');

  app.enableCors(corsOptions(env));
  setSwagger(app);

  console.log(`env: ${env}\t port: ${port}\t service name: ${serviceName}`);
  await app.listen(port);
}
bootstrap();
