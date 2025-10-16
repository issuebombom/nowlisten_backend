import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';
import { Repository } from 'typeorm';
import { InviteStatus } from 'src/common/types/invite-status.type';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceMember } from '../entities/workspace-member.entity';

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
    memberId: string,
    workspaceId: string,
  ) {
    const wsInvitation = new WorkspaceInvitation();

    wsInvitation.inviteeEmail = inviteeEmail;
    wsInvitation.status = InviteStatus.INVITED;
    wsInvitation.invitedAt = invitedAt;
    wsInvitation.token = token;
    wsInvitation.expiresAt = expiresAt;
    wsInvitation.member = { id: memberId } as WorkspaceMember;
    wsInvitation.workspace = { id: workspaceId } as Workspace;
    return this.repo.save(wsInvitation);
  }

  updateWorkspaceInvitation(id: string, options: Partial<WorkspaceInvitation>) {
    return this.repo.update(id, options);
  }

  findMyWorkspaceInvitations(memberId: string, workspaceId: string) {
    return this.repo.find({
      where: { member: { id: memberId }, workspace: { id: workspaceId } },
    });
  }

  findWorkspaceInvitationByToken(token: string): Promise<WorkspaceInvitation> {
    return this.repo
      .createQueryBuilder('invitation')
      .select([
        'invitation.id',
        'invitation.inviteeEmail',
        'invitation.status',
        'invitation.invitedAt',
        'invitation.token',
        'invitation.expiresAt',
        'member.id',
        'member.name',
        'member.status',
        'member.role',
        'ws.id',
        'ws.name',
        'ws.status',
      ])
      .leftJoin('invitation.member', 'member')
      .leftJoin('invitation.workspace', 'ws')
      .where('invitation.token = :token', { token })
      .getOne();
  }
}
