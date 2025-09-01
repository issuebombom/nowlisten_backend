import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MAIL_TRANSPORTER',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport({
          host: configService.get<string>('SMTP_HOST'),
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('SMTP_USER_NAME'),
            pass: configService.get<string>('SMTP_PASSWORD'),
          },
        });
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
