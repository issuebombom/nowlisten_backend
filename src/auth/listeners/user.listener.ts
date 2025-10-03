import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from 'src/mail/mail.service';
import { UserCreatedEvent } from '../events/user.created.event';

@Injectable()
export class UserListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('user.created')
  async handleUserCreatedEvent(payload: UserCreatedEvent) {
    // 메일 발송
    await this.mailService.sendWelcomeEmail(payload.email, payload.username);
  }
}
