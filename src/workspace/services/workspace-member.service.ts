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
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { GetMembersResDto } from '../dto/get-members-res.dto';

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
  ): Promise<GetMembersResDto> {
    // 워크스페이스 멤버 검증
    await this.findMemberByIds(userId, workspaceId);

    return await this.findMembersByWsId(
      workspaceId,
      limit,
      isNext,
      lastMemberId,
    );
  }

  private async findMembersByWsId(
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
      lastMemberId: isNext
        ? members.at(-2).id
        : members.length !== 0
          ? members.at(-1).id // next는 없지만 쿼리 결과가 있을 경우
          : null, // 쿼리 결과가 없을 경우
    };
  }

  async updateWorkspaceMemberRole(
    userId: string,
    workspaceId: string,
    targetMemberId: string,
    changeRole: WorkspaceRole,
  ) {
    // 멤버 역할 수정에 대한 권한 유무 체크
    await this.hasRequiredRolePermission(
      RolePermission.WORKSPACE_MANAGE_SETTINGS,
      userId,
      workspaceId,
    );

    await this.workspaceMemberRepo.updateMemberById(targetMemberId, {
      role: changeRole,
    });
  }

  async deleteWorkspaceMember(
    userId: string,
    workspaceId: string,
    memberId: string,
  ): Promise<void> {
    await this.hasRequiredRolePermission(
      RolePermission.WORKSPACE_REMOVE_MEMBER,
      userId,
      workspaceId,
    );

    // 멤버 존재 유무 확인
    await this.findMemberById(memberId);

    // 멤버 삭제
    await this.workspaceMemberRepo.deleteWorkspaceMember(memberId);
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
   * -> workspaceId만 인덱스 추가
   *    - 워크스페이스 내 최대 멤버수는 많아야 수 천 이하 정도 될 것으로 예상
   *    - ws id로 접근 후 수 천을 풀 스캔해도 성능에 문제 없을 것으로 예상
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

  async findMemberByEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceMember> {
    const member = await this.workspaceMemberRepo.findMemberByEmail(
      workspaceId,
      email,
    );

    if (!member) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `email: ${email} is not a member of this workspacce(${workspaceId})`,
        `this email is not a member of this workspace`,
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
