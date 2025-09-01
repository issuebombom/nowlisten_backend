import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { Transporter } from 'nodemailer';
import { join } from 'path';

const MAIL_TEMPLATES_DIR = join(process.cwd(), 'src', 'mail', 'templates');

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_TRANSPORTER')
    private readonly transporter: Transporter,
  ) {}

  // ! NOTE: 추후 템플릿엔진(handlebars)으로 대체
  async sendWelcomeEmail(to: string, name: string) {
    const html = await this.getTemplate('welcome.html');
    await this.transporter.sendMail({
      from: 'no-reply@nowlisten.shop',
      to,
      subject: `NOWLISTEN에 오신 것을 환영합니다. ${name}님`,
      html: html.replace('{{username}}', name),
    });
  }

  private async getTemplate(fileName: string): Promise<string> {
    const welcomeTemplate = join(MAIL_TEMPLATES_DIR, fileName);
    const html = await readFile(welcomeTemplate, 'utf-8');
    return html;
  }
}
