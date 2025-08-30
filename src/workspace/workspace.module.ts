import { Module } from '@nestjs/common';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceMemberService } from './services/workspace-member.service';
import { WorkspaceRepository } from './repositories/workspace.repository';
import { WorkspaceMemberRepository } from './repositories/workspace-member.repository';
import { WorkspaceController } from './controllers/workspace.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMember } from './entities/workspace-member.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Workspace, WorkspaceMember])],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceMemberService,

    WorkspaceRepository,
    WorkspaceMemberRepository,
  ],
  exports: [],
})
export class WorkspaceModule {}
