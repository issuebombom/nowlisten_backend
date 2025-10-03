import { Injectable } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { WorkspaceCreatedInvitationEvent } from '../events/workspace.created-invitation.event';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class WorkspaceListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('workspace.created-invitation')
  async handleCreatedInvitation(payload: WorkspaceCreatedInvitationEvent) {
    // 메일 발송
    await this.mailService.sendWorkspaceInvitationEmail(
      payload.inviteeEmail,
      payload.workspaceName,
      payload.inviterName,
      payload.inviteToken,
    );
  }
}
