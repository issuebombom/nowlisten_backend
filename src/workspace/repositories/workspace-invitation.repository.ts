import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';
import { Repository } from 'typeorm';
import { InviteStatus } from 'src/common/types/invite-status.type';
import { User } from 'src/auth/entities/user.entity';
import { Workspace } from '../entities/workspace.entity';

@Injectable()
export class WorkspaceInvitationRepository {
  constructor(
    @InjectRepository(WorkspaceInvitation)
    private readonly repo: Repository<WorkspaceInvitation>,
  ) {}

  createWorkspaceInvitation(
    inviteeEmail: string,
    invitedAt: Date,
    token: string,
    expiresAt: Date,
    inviterUserId: string,
    workspaceId: string,
  ) {
    const wsInvitation = new WorkspaceInvitation();

    wsInvitation.inviteeEmail = inviteeEmail;
    wsInvitation.status = InviteStatus.INVITED;
    wsInvitation.invitedAt = invitedAt;
    wsInvitation.token = token;
    wsInvitation.expiresAt = expiresAt;
    wsInvitation.user = { id: inviterUserId } as User;
    wsInvitation.workspace = { id: workspaceId } as Workspace;
    return this.repo.save(wsInvitation);
  }
}
