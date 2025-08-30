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
}
