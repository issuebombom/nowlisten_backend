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
import { WorkspaceInvitation } from './entities/workspace-invitation.entity';
import { WorkspaceInvitationService } from './services/workspace-invitation.service';
import { WorkspaceInvitationRepository } from './repositories/workspace-invitation.repository';
import { WorkspaceListener } from './listeners/workspace.listener';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    AuthModule,
    MailModule,
    TypeOrmModule.forFeature([Workspace, WorkspaceMember, WorkspaceInvitation]),
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    WorkspaceMemberService,
    WorkspaceInvitationService,

    WorkspaceRepository,
    WorkspaceMemberRepository,
    WorkspaceInvitationRepository,

    WorkspaceListener,
  ],
  exports: [],
})
export class WorkspaceModule {}
