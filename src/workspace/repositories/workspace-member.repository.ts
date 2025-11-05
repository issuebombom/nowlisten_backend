import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMember } from '../entities/workspace-member.entity';
import { Workspace } from '../entities/workspace.entity';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { User } from 'src/auth/entities/user.entity';
import { MemberStatus } from 'src/common/types/member-status.type';

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
  ): Promise<WorkspaceMember[]> {
    const query = this.repo
      .createQueryBuilder('member')
      .select(['member', 'user.id', 'user.email'])
      .where('member.workspace.id = :workspaceId', { workspaceId })
      .leftJoin('member.user', 'user')
      .orderBy('member.id', 'ASC')
      .limit(limit + 1);

    if (isNext && lastMemberId) {
      query.andWhere('member.id > :lastMemberId', { lastMemberId });
    }

    return await query.getMany();
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

  async findMemberByEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceMember> {
    return await this.repo
      .createQueryBuilder('member')
      .select(['member', 'user.id', 'user.email'])
      .leftJoin('member.user', 'user')
      .where('member.workspace.id = :workspaceId', { workspaceId })
      .andWhere('user.email = :email', { email })
      .getOne();
  }

  updateMemberById(memberId: string, options: Partial<WorkspaceMember>) {
    return this.repo.update(memberId, options);
  }

  deleteWorkspaceMember(memberId: string) {
    return this.repo.delete(memberId);
  }
}
