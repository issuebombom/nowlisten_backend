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

  async getWorkspaceMembers(
    userId: string,
    workspaceId: string,
    limit: number,
    isNext?: boolean,
    lastMemberId?: string,
  ) {
    // 워크스페이스 멤버 검증
    await this.findMemberByIds(userId, workspaceId);

    return await this.getMembersByWsId(
      workspaceId,
      limit,
      isNext,
      lastMemberId,
    );
  }

  async getMembersByWsId(
    workspaceId: string,
    limit: number,
    isNext?: boolean,
    lastMemberId?: string,
  ) {
    // 리미트 + 1 만큼의 개수를 조회해서 next가 있는지 확인한다.
    const members = await this.workspaceMemberRepo.getMembersByWsId(
      workspaceId,
      limit,
      isNext,
      lastMemberId,
    );

    isNext = members.length > limit; // 다음 데이터가 있는가?
    return {
      result: isNext ? members.slice(0, -1) : members,
      isNext,
      lastMemberId: isNext ? members.at(-2).id : members.at(-1).id,
    };
  }

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

  /**
   * ! NOTE: 워크스페이스 접근 권한 확인 관련 쿼리 시 성능 저하 우려
   * member 테이블에서 userId와 workspaceId에 대한 멀티인덱스 추가 고려
   */
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
