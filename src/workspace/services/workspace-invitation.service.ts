import { HttpStatus, Injectable } from '@nestjs/common';
import { WorkspaceInvitationRepository } from '../repositories/workspace-invitation.repository';
import { WorkspaceMemberService } from './workspace-member.service';
import {
  RolePermission,
  WorkspaceRolePermission,
} from 'src/common/utils/role-permission';
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
import { UserService } from 'src/auth/services/user.service';
import { MemberStatus } from 'src/common/types/member-status.type';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';

@Injectable()
export class WorkspaceInvitationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly wsService: WorkspaceService,
    private readonly wsMemberService: WorkspaceMemberService,
    private readonly wsInvitationRepo: WorkspaceInvitationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createWorkspaceInvitaion(
    inviterUserId: string,
    inviteeEmail: string,
    workspaceId: string,
  ) {
    // 액티브 유저인가 + 권한이 있나
    const member = await this.wsMemberService.hasRequiredRolePermission(
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
    // 토큰 생성
    const inviteToken = genCryptoId(32);
    // 초대 날짜 생성
    const invitedAt = new Date();
    // 토큰 만료일 생성 (env에서 expiresIn 기반)
    const expiresIn = this.configService.get<string>('INVITATION_EMAIL_EXPIRY');
    const expiresAt = calculateExpiry(expiresIn, invitedAt);
    // 초대 레코드 생성
    await this.wsInvitationRepo.createWorkspaceInvitation(
      inviteeEmail,
      invitedAt,
      inviteToken,
      expiresAt,
      member.id,
      workspaceId,
    );
    // 초대 이벤트 발송 (초대자 이메일, 워크스페이스 이름, 초대한 유저 이름, 초대 코드)
    this.eventEmitter.emitAsync(
      'workspace.created-invitation',
      new WorkspaceCreatedInvitationEvent(
        inviteeEmail,
        workspace.name,
        member.name,
        inviteToken,
      ),
    );
  }

  async getWorkspaceInvitationByToken(
    userId: string,
    email: string,
    token: string,
  ): Promise<WorkspaceInvitation> {
    // 토큰과 접속 유저 일치하는지 확인
    const invitation =
      await this.wsInvitationRepo.findWorkspaceInvitationByToken(token);

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
    if (invitation.inviteeEmail !== email) {
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
      userId,
      invitation.workspace.id,
    );

    return invitation;
  }
}
