import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from 'src/mail/mail.service';
import { AuthResetPasswordEvent } from '../events/auth-reset-password.event';

@Injectable()
export class AuthListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('auth.reset-password')
  async handleUserCreatedEvent(payload: AuthResetPasswordEvent) {
    // 메일 발송
    await this.mailService.sendResetPasswordEmail(
      payload.token,
      payload.email,
      payload.username,
    );
  }
}
