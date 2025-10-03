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

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly userService: UserService,
    private readonly workspaceRepo: WorkspaceRepository,
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
        `id ${id} not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return workspace;
  }

  private createSlug(workspaceName: string) {
    return workspaceName + '-' + genId(12);
  }
}
