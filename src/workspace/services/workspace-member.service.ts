import { HttpStatus, Injectable } from '@nestjs/common';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import {
  combinePermissionByList,
  hasWorkspacePermission,
  RolePermission,
} from 'src/common/utils/role-permission';
import { MemberStatus } from 'src/common/types/member-status.type';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { WorkspaceMember } from '../entities/workspace-member.entity';
@Injectable()
export class WorkspaceMemberService {
  constructor(
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
  ) {}

  async findMemberById(memberId: string) {
    const member = await this.workspaceMemberRepo.findMemberById(memberId);

    if (!member) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `member not exists`,
        `member not exists`,
        HttpStatus.NOT_FOUND,
      );
    }

    return member;
  }

  async findMemberByIds(userId: string, workspaceId: string) {
    const member = await this.workspaceMemberRepo.findMemberByIds(
      userId,
      workspaceId,
    );

    if (!member) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `id: ${userId} is not a member of this workspace(${workspaceId})`,
        `this user is not a member of this workspace`,
        HttpStatus.NOT_FOUND,
      );
    }

    return member;
  }

  async hasRequiredRolePermission(
    requiredPermission: RolePermission | RolePermission[],
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.findMemberByIds(userId, workspaceId);

    // permission이 여러 개일 경우
    if (Array.isArray(requiredPermission)) {
      requiredPermission = combinePermissionByList(requiredPermission);
    }

    const hasPermission = hasWorkspacePermission(
      member.role,
      requiredPermission,
    );

    // 자격 증명 + 액티브 유저 유무
    if (!hasPermission || member.status !== MemberStatus.ACTIVE) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `Permission Denied`,
        `Permission Denied`,
        HttpStatus.FORBIDDEN,
      );
    }
    return member;
  }
}
