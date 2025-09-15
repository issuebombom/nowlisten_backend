import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../entities/workspace-member.entity';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { User } from 'src/auth/entities/user.entity';
import { MemberStatus } from 'src/common/types/member-status.type';
import { keysToCamel } from 'src/common/utils/case.util';
import { GetWorkspaceResDto } from '../dto/get-workspace-res.dto';

@Injectable()
export class WorkspaceMemberRepository {
  constructor(
    @InjectRepository(WorkspaceMember)
    private readonly repo: Repository<WorkspaceMember>,
  ) {}

  createMember(
    name: string,
    role: WorkspaceRole,
    status: MemberStatus,
    workspace: Workspace,
    user: User,
  ): Promise<WorkspaceMember> {
    const member = new WorkspaceMember();
    member.name = name;
    member.role = role;
    member.status = status;
    member.joinedAt = new Date();
    member.workspace = workspace;
    member.user = user;
    return this.repo.save(member);
  }

  // ! NOTE: 이게 멤버 레포에 있어야 하나? (유저 id로 접근하니까 타당함?)
  async findWorkspaceByUserId(userId: string): Promise<GetWorkspaceResDto[]> {
    const rows = await this.repo.query(
      `SELECT 
          ws.*, wm.name AS member_name, wm.role AS member_role
       FROM 
          workspace_member AS wm
       LEFT JOIN
          workspace AS ws ON wm.workspace_id = ws.id
       WHERE 
          wm.user_id = $1
       ORDER BY wm.joined_at DESC
       `,
      [userId],
    );
    return rows.map(keysToCamel);
  }

  async findMemberByIds(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMember> {
    return await this.repo.findOneBy({
      user: { id: userId },
      workspace: { id: workspaceId },
    });
  }
}
