import { Injectable } from '@nestjs/common';
import { WorkspaceRepository } from '../repositories/workspace.repository';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';
import { Transactional } from 'typeorm-transactional';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { UserService } from 'src/auth/services/user.service';
import { genId } from 'src/common/utils/gen-id';
import { MemberStatus } from 'src/common/types/member-status.type';

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
      workspace,
      user,
    );

    return workspace;
  }

  private createSlug(workspaceName: string) {
    return workspaceName + '-' + genId(12);
  }
}
