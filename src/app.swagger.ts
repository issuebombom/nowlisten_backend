import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';

export function setSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const serviceName = configService.get<string>('SERVICE_NAME');
  const config = new DocumentBuilder()
    .setTitle(`${serviceName} API Docs`)
    .setDescription(`${serviceName}의 API 문서입니다.`)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'token',
    )
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  // Swagger Auth: Basic Auth
  const SWAGGER_ID = configService.get<string>('SWAGGER_ID');
  const SWAGGER_PW = configService.get<string>('SWAGGER_PW');

  // Middleware
  app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization || '';
    const [authType, credentials] = auth.split(' ');

    // 초기 접근, 입력값이 없을 경우
    if (authType !== 'Basic' || !credentials) {
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).end('Authentication required');
    }

    // 입력값 디코딩
    const [username, password] = Buffer.from(credentials, 'base64')
      .toString()
      .split(':');

    // ID, PW 불일치 시
    if (username !== SWAGGER_ID || password !== SWAGGER_PW) {
      return res.status(401).end('Invalid credentials');
    }

    // 통과
    next();
  });
  SwaggerModule.setup('api-docs', app, documentFactory);
}
