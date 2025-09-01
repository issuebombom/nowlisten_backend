import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { Transporter } from 'nodemailer';
import { join } from 'path';

const MAIL_TEMPLATES_DIR = join(process.cwd(), 'src', 'mail', 'templates');

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_TRANSPORTER')
    private readonly transporter: Transporter,
    private readonly configService: ConfigService,
  ) {}

  DOMAIN_NAME = this.configService.get<string>('DOMAIN_NAME');
  PUBLIC_SERVICE_NAME = this.configService.get<string>('PUBLIC_SERVICE_NAME');

  // ! NOTE: 추후 템플릿엔진(handlebars)으로 대체
  async sendWelcomeEmail(email: string, username: string) {
    const html = await this.getTemplate('welcome.html');
    await this.transporter.sendMail({
      from: `"${this.PUBLIC_SERVICE_NAME}" <no-reply@${this.DOMAIN_NAME}>`,
      to: email,
      subject: `${username}님, NOWLISTEN에 가입해 주셔서 감사합니다.`,
      html: html
        .replaceAll('{{username}}', username)
        .replaceAll('{{companyName}}', this.PUBLIC_SERVICE_NAME),
    });
  }

  async sendResetPasswordEmail(token: string, email: string, username: string) {
    const html = await this.getTemplate('reset-password.html');
    const resetPasswordUrl = this.configService.get<string>(
      'FRONT_RESET_PASSWORD_URL',
    );
    await this.transporter.sendMail({
      from: `"${this.PUBLIC_SERVICE_NAME}" <no-reply@${this.DOMAIN_NAME}>`,
      to: email,
      subject: `${username}님, 비밀번호 재설정을 위한 링크 안내드립니다.`,
      html: html
        .replaceAll('{{username}}', username)
        .replaceAll('{{resetLink}}', `${resetPasswordUrl}?token=${token}`)
        .replaceAll('{{companyName}}', this.PUBLIC_SERVICE_NAME),
    });
  }

  private async getTemplate(fileName: string): Promise<string> {
    const htmlTemplate = join(MAIL_TEMPLATES_DIR, fileName);
    return await readFile(htmlTemplate, 'utf-8');
  }
}
