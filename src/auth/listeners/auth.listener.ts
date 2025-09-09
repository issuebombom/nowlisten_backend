import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from 'src/mail/mail.service';
import { AuthResetPasswordEvent } from '../events/auth.reset-password.event';
import { AuthSendVerificationCodeEvent } from '../events/auth.send-verification-code.event';
import { AuthMethod } from 'src/common/types/auth-method.type';

@Injectable()
export class AuthListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('auth.reset-password')
  async handleResetPasswordEvent(payload: AuthResetPasswordEvent) {
    // 메일 발송
    await this.mailService.sendResetPasswordEmail(
      payload.token,
      payload.email,
      payload.username,
    );
  }

  @OnEvent('auth.send-verification-code')
  async handleSendVerificationCode(payload: AuthSendVerificationCodeEvent) {
    if (payload.method === AuthMethod.EMAIL) {
      // 메일 발송
      await this.mailService.sendVerificationCodeEmail(
        payload.credential,
        payload.code,
      );
    }
  }
}
