import { HttpStatus, Injectable } from '@nestjs/common';
import { WorkspaceInvitationRepository } from '../repositories/workspace-invitation.repository';
import { WorkspaceMemberService } from './workspace-member.service';
import { RolePermission } from 'src/common/utils/role-permission';
import { WorkspaceService } from './workspace.service';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { genCryptoId } from 'src/common/utils/gen-id.util';
import { calculateExpiry } from 'src/common/utils/calculate-expiry.util';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkspaceCreatedInvitationEvent } from '../events/workspace.created-invitation.event';
import { WorkspaceStatus } from 'src/common/types/workspace-status.type';
import { InviteStatus } from 'src/common/types/invite-status.type';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';
import { Transactional } from 'typeorm-transactional';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { MemberStatus } from 'src/common/types/member-status.type';
import { omit } from 'lodash';

@Injectable()
export class WorkspaceInvitationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly wsService: WorkspaceService,
    private readonly wsMemberService: WorkspaceMemberService,
    private readonly wsMemberRepo: WorkspaceMemberRepository,
    private readonly wsInvitationRepo: WorkspaceInvitationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createWorkspaceInvitation(
    inviterUserId: string,
    inviteeEmail: string,
    workspaceId: string,
  ) {
    // 액티브 유저인가 + 권한이 있나
    const inviterMember = await this.wsMemberService.hasRequiredRolePermission(
      RolePermission.WORKSPACE_INVITE_MEMBER,
      inviterUserId,
      workspaceId,
    );
    // 워크스페이스가 액티브한가
    const workspace = await this.wsService.getWorkspaceById(workspaceId);
    if (workspace.status !== WorkspaceStatus.ACTIVE) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `workspace is deactivated: ${workspace.id}`,
        `workspace is deactivated`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 초대자가 이미 워크스페이스 멤버인가
    const inviteeMember = await this.wsMemberRepo.findMemberByEmail(
      workspaceId,
      inviteeEmail,
    );
    if (inviteeMember) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `this email(${inviteeEmail}) is already in workspace(${workspaceId})`,
        `this email is already in workspace`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 토큰 생성
    const inviteToken = genCryptoId(32);
    // 초대 날짜 생성
    const invitedAt = new Date();
    // 토큰 만료일 생성 (env에서 expiresIn 기반)
    const expiresIn = this.configService.get<string>('INVITATION_EMAIL_EXPIRY');
    const expiresAt = calculateExpiry(expiresIn, invitedAt);

    // 이미 초대한 이력이 있을 경우 이미 생성된 레코드를 재사용
    const alreadyInvited = await this.isAlreadyInvited(
      inviterMember.id,
      workspaceId,
      inviteeEmail,
    );
    if (alreadyInvited) {
      // 기존 초대 레코드 수정 및 재사용
      alreadyInvited.status = InviteStatus.INVITED;
      alreadyInvited.invitedAt = invitedAt;
      alreadyInvited.respondedAt = null;
      alreadyInvited.token = inviteToken;
      alreadyInvited.expiresAt = expiresAt;

      const editInvitation = omit(alreadyInvited, ['createdAt', 'updatedAt']);
      await this.wsInvitationRepo.updateWorkspaceInvitation(
        alreadyInvited.id,
        editInvitation,
      );
    } else {
      // 초대 레코드 생성
      await this.wsInvitationRepo.createWorkspaceInvitation(
        inviteeEmail,
        invitedAt,
        inviteToken,
        expiresAt,
        inviterMember.id,
        workspaceId,
      );
    }
    // 초대 이벤트 발송 (초대자 이메일, 워크스페이스 이름, 초대한 유저 이름, 초대 코드)
    this.eventEmitter.emitAsync(
      'workspace.created-invitation',
      new WorkspaceCreatedInvitationEvent(
        inviteeEmail,
        workspace.name,
        inviterMember.name,
        inviteToken,
      ),
    );
  }

  async getMyWorkspaceInvitations(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceInvitation[]> {
    const member = await this.wsMemberRepo.findMemberByIds(userId, workspaceId);
    return await this.wsInvitationRepo.findMyWorkspaceInvitations(
      member.id,
      workspaceId,
    );
  }

  async getInvitationInfo(
    email: string,
    token: string,
  ): Promise<WorkspaceInvitation> {
    const invitation = await this.getWorkspaceInvitationByToken(token);
    const member = await this.wsMemberService.findMemberById(
      invitation.member.id,
    );

    // 초대 검증
    await this.validateInvitation(invitation, member.user.id, email);

    return invitation;
  }

  async approveInvitation(
    userId: string,
    email: string,
    token: string,
    nickname: string,
  ): Promise<void> {
    const invitation = await this.getWorkspaceInvitationByToken(token);
    const member = await this.wsMemberService.findMemberById(
      invitation.member.id,
    );

    // 초대 검증
    await this.validateInvitation(invitation, member.user.id, email);

    // 트랜잭션 - invitation 업데이트, 멤버 생성
    await this.updateInvitationAndCreateWorkspaceMember(
      invitation,
      nickname,
      userId,
    );
  }

  async rejectInvitation(email: string, token: string): Promise<void> {
    const invitation = await this.getWorkspaceInvitationByToken(token);
    const member = await this.wsMemberService.findMemberById(
      invitation.member.id,
    );

    // 초대 검증
    await this.validateInvitation(invitation, member.user.id, email);

    await this.wsInvitationRepo.updateWorkspaceInvitation(invitation.id, {
      status: InviteStatus.REJECTED,
      respondedAt: new Date(),
    });
  }

  async cancelInvitation(userId: string, token: string): Promise<void> {
    const invitation = await this.getWorkspaceInvitationByToken(token);
    const member = await this.wsMemberRepo.findMemberByIds(
      userId,
      invitation.workspace.id,
    );

    if (invitation.status !== InviteStatus.INVITED) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `Invitation has already been processed: ${invitation.status}`,
        `Invitation has  already been processed`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (invitation.member.id !== member.id) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `Invitation member id does not match: ${member.id}`,
        `Invitation member does not match`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    await this.wsInvitationRepo.updateWorkspaceInvitation(invitation.id, {
      status: InviteStatus.CANCELED,
    });
  }

  async getWorkspaceInvitationByToken(
    token: string,
  ): Promise<WorkspaceInvitation> {
    const invitation =
      await this.wsInvitationRepo.findWorkspaceInvitationByToken(token);

    if (!invitation) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `token not exists: ${token}`,
        `token not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return invitation;
  }

  private async isAlreadyInvited(
    memberId: string,
    workspaceId: string,
    inviteeEmail: string,
  ): Promise<WorkspaceInvitation> {
    const invitations = await this.wsInvitationRepo.findMyWorkspaceInvitations(
      memberId,
      workspaceId,
    );
    const invitation = invitations.find(
      (obj) => obj.inviteeEmail === inviteeEmail,
    );

    return invitation;
  }

  private async validateInvitation(
    invitation: WorkspaceInvitation,
    inviterUserId: string,
    inviteeEmail: string,
  ): Promise<void> {
    // 초대장의 상태, 만료일 체크
    if (
      invitation.status !== InviteStatus.INVITED ||
      invitation.expiresAt < new Date()
    ) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `Invitation has expired: ${invitation.id}`,
        `Invitation has expired`,
        HttpStatus.GONE,
      );
    }
    // 해당 유저가 초대받은 유저가 맞는가
    if (invitation.inviteeEmail !== inviteeEmail) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `Invitation email does not match`,
        `Invitation email does not match`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 해당 워크스페이스가 Active한가
    if (invitation.workspace.status !== WorkspaceStatus.ACTIVE) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `Workspace is deactivated: ${invitation.workspace.id}`,
        `Workspace is deactivated`,
        HttpStatus.FORBIDDEN,
      );
    }

    // 초대한 멤버의 현재 자격 증명
    await this.wsMemberService.hasRequiredRolePermission(
      RolePermission.WORKSPACE_INVITE_MEMBER,
      inviterUserId,
      invitation.workspace.id,
    );
  }

  @Transactional()
  private async updateInvitationAndCreateWorkspaceMember(
    invitation: WorkspaceInvitation,
    nickname: string,
    userId: string,
  ) {
    // invitation status를 변경
    await this.wsInvitationRepo.updateWorkspaceInvitation(invitation.id, {
      status: InviteStatus.ACCEPTED,
      respondedAt: new Date(),
    });

    // 신규 멤버 생성
    await this.wsMemberRepo.createMember(
      nickname,
      WorkspaceRole.MEMBER,
      MemberStatus.ACTIVE,
      invitation.workspace.id,
      userId,
    );
  }
}
