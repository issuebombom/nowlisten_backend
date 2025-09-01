import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateWorkspaceReqDto } from '../dto/create-workspace-req.dto';
import { ApiOperation } from '@nestjs/swagger';
import { WorkspaceService } from '../services/workspace.service';
import { Workspace } from '../entities/workspace.entity';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { IJwtUserProfile } from 'src/auth/interfaces/auth-guard-user.interface';

@Controller('ws')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '새 워크스페이스 생성' })
  async createWorkspace(
    @AuthUser() user: IJwtUserProfile,
    @Body()
    createWorkspaceReqDto: CreateWorkspaceReqDto,
  ): Promise<Workspace> {
    // ! NOTE: 리턴값 어떻게? 전체 또는 slug(id)? 우선은 ws 전체 리턴
    const { workspaceName, userNickname } = createWorkspaceReqDto;
    return this.workspaceService.createWorkspace(
      workspaceName,
      userNickname,
      user.userId,
    );
  }
}
