import { Injectable } from '@nestjs/common';
import { WorkspaceMemberRepository } from '../repositories/workspace-member.repository';

@Injectable()
export class WorkspaceMemberService {
  constructor(
    private readonly workspaceMemberRepo: WorkspaceMemberRepository,
  ) {}
}
