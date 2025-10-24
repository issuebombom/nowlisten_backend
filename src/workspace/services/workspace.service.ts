import { HttpStatus, Injectable } from '@nestjs/common';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { Transactional } from 'typeorm-transactional';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { UserService } from 'src/auth/services/user.service';
import { genId } from 'src/common/utils/gen-id.util';
import { MemberStatus } from 'src/common/types/member-status.type';
import { GetWorkspaceResDto } from '../dto/get-workspace-res.dto';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceStatus } from 'src/common/types/workspace-status.type';
import {
  RolePermission,
  WorkspaceRolePermission,
} from 'src/common/utils/role-permission';
import { WorkspaceMemberService } from './workspace-member.service';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly userService: UserService,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly wsMemberService: WorkspaceMemberService,
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
  ) {}

  @Transactional()
  async createWorkspace(
    workspaceName: string,
    userNickname: string,
    userId: string,
  ) {
    // ! 트랜잭션
    const user = await this.userService.getUserById(userId);

    // 슬러그 생성(추후 서브도메인명으로 활용 예정)
    // ! NOTE: slug를 ws명-식별자로 생성하기 위함 (초깃값 중복 방지)
    const replacedWorkspaceName = workspaceName.replaceAll(' ', '');
    const slug = this.createSlug(replacedWorkspaceName);

    // 워크스페이스 생성
    const workspace = await this.workspaceRepo.createWorkspace(
      replacedWorkspaceName,
      slug,
    );

    // 멤버 생성(owner 등록)
    await this.workspaceMemberRepo.createMember(
      userNickname,
      WorkspaceRole.OWNER,
      MemberStatus.ACTIVE,
      workspace.id,
      user.id,
    );

    return workspace;
  }

  /**
   * TODO: 워크스페이스 조회
   * - 유저 id로 워크스페이스 맴버 조회(status: active)
   * - 비활성화된 워크스페이스(inactive)는 제외 / OWNER의 경우 노출 (프론트 필요)
   * - 최근 생성일로 정렬(쿼리에서진행, 유저에게 선택권 없음)
   */
  async getMyWorkspaces(userId: string): Promise<GetWorkspaceResDto[]> {
    const workspaces =
      await this.workspaceMemberRepo.findWorkspaceByUserId(userId);

    return workspaces.filter(
      (ws) =>
        ws.status === WorkspaceStatus.ACTIVE ||
        WorkspaceRolePermission[ws.memberRole] &
          RolePermission.WORKSPACE_MANAGE_SETTINGS,
    );
  }

  async getWorkspaceById(id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findWorkspaceById(id);
    if (!workspace) {
      throw new BusinessException(
        ErrorDomain.Workspace,
        `workspace not exists: ${id}`,
        `workspace not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return workspace;
  }

  async updateWorkspaceName(name: string, workspaceId: string, userId: string) {
    // 자격 겸증 (워크스페이스 설정 변경 권한)
    await this.wsMemberService.hasRequiredRolePermission(
      RolePermission.WORKSPACE_MANAGE_SETTINGS,
      userId,
      workspaceId,
    );

    // 이름 변경
    this.workspaceRepo.updateWorkspaceById(workspaceId, { name });
  }

  async updateWorkspaceSlug(slug: string, workspaceId: string, userId: string) {
    // 자격 겸증 (워크스페이스 설정 변경 권한)
    await this.wsMemberService.hasRequiredRolePermission(
      RolePermission.WORKSPACE_MANAGE_SETTINGS,
      userId,
      workspaceId,
    );

    // slug 변경 시도
    /** NOTE: slug update에서 중복값 검사를 쿼리에 맡기는 이유
     * slug 필드는 unique 등록이 되어있어 인덱스 추가가 되어있음
     * 중복검사 쿼리를 따로 날릴 필요없이 update 쿼리 과정에서 중복검사하는걸 캐치한다
     */
    try {
      await this.workspaceRepo.updateWorkspaceById(workspaceId, { slug });
    } catch (error) {
      // 중복값 적용 시 에러
      if (error.code === '23505') {
        throw new BusinessException(
          ErrorDomain.Workspace,
          `this slug already exists: ${slug}`,
          `this slug already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  async deleteWorkspaceById(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    // ws ID 존재 유무 확인
    await this.getWorkspaceById(workspaceId);

    // 자격 증명 (해당 워크스페이스의 삭제 자격이 있는가?)
    await this.wsMemberService.hasRequiredRolePermission(
      RolePermission.WORKSPACE_MANAGE_SETTINGS,
      userId,
      workspaceId,
    );

    // 삭제
    this.workspaceRepo.deleteWorkspaceById(workspaceId);
  }

  private createSlug(workspaceName: string) {
    return workspaceName + '-' + genId(12);
  }
}
