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
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember> {
    const member = new WorkspaceMember();
    member.name = name;
    member.role = role;
    member.status = status;
    member.joinedAt = new Date();
    member.workspace = { id: workspaceId } as Workspace;
    member.user = { id: userId } as User;
    return this.repo.save(member);
  }

  async getMembersByWsId(
    workspaceId: string,
    limit: number,
    isNext?: boolean,
    lastMemberId?: string,
  ) {
    return await this.repo
      .createQueryBuilder('member')
      .where('member.workspace.id = :workspaceId', { workspaceId })
      .andWhere(isNext ? 'member.id > :lastMemberId' : '1=1', { lastMemberId })
      .orderBy('member.id', 'ASC')
      .limit(limit + 1)
      .getMany();
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

  async findMemberById(memberId: string): Promise<WorkspaceMember> {
    return await this.repo
      .createQueryBuilder('member')
      .select(['member', 'user.id'])
      .leftJoin('member.user', 'user')
      .where('member.id = :memberId', { memberId })
      .getOne();
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
