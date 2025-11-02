import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from '../entities/workspace.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkspaceRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  createWorkspace(name: string, slug: string): Promise<Workspace> {
    const workspace = new Workspace();
    workspace.name = name;
    workspace.slug = slug;
    return this.repo.save(workspace);
  }

  findWorkspaceById(id: string): Promise<Workspace> {
    return this.repo.findOneBy({ id });
  }

  findWorkspaceByUserId(userId: string): Promise<Workspace[]> {
    return this.repo
      .createQueryBuilder('workspace')
      .select(['workspace', 'member.id', 'member.name', 'member.role'])
      .leftJoin('workspace.member', 'member')
      .leftJoin('member.user', 'user')
      .where('member.user.id = :userId', { userId })
      .orderBy('workspace.createdAt', 'ASC')
      .getMany();
  }

  updateWorkspaceById(id: string, options: Partial<Workspace>) {
    return this.repo.update(id, options);
  }

  deleteWorkspaceById(id: string) {
    return this.repo.delete(id);
  }
}
