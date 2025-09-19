import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateWorkspaceReqDto } from '../dto/create-workspace-req.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WorkspaceService } from '../services/workspace.service';
import { Workspace } from '../entities/workspace.entity';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { IJwtUserProfile } from 'src/auth/interfaces/auth-guard-user.interface';
import { GetWorkspaceResDto } from '../dto/get-workspace-res.dto';
import { InviteUserByEmailReqDto } from '../dto/invite-user-by-email-req.dto';
import { WorkspaceInvitationService } from '../services/workspace-invitation.service';
import { WorkspaceInvitation } from '../entities/workspace-invitation.entity';
import { GetInvitationInfoResDto } from '../dto/get-invitation-info-res.dto';

@Controller('ws')
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly wsInvitationService: WorkspaceInvitationService,
  ) {}

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내 워크스페이스 조회' })
  @ApiResponse({
    description: '워크스페이스 조회 완료',
  })
  async getMyWorkspaces(
    @AuthUser() user: IJwtUserProfile,
  ): Promise<GetWorkspaceResDto[]> {
    return await this.workspaceService.getMyWorkspaces(user.userId);
  }

  @Post('invite/email')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '워크스페이스 초대' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '워크스페이스 초대 메일 발송 완료 (초대 레코드 생성)',
  })
  async inviteUserByEmail(
    @AuthUser() user: IJwtUserProfile,
    @Body() dto: InviteUserByEmailReqDto,
  ): Promise<void> {
    await this.wsInvitationService.createWorkspaceInvitaion(
      user.userId,
      dto.inviteeEmail,
      dto.workspaceId,
    );
  }

  // join 페이지 접속 시 보여 줄 초대 관련 정보 전달
  @Get('invite/:token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '초대 정보 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '초대 토큰 기반 초대 정보 출력',
    type: GetInvitationInfoResDto,
  })
  async getInvitationInfo(
    @AuthUser() user: IJwtUserProfile,
    @Param('token') invitationToken: string,
  ): Promise<WorkspaceInvitation> {
    return await this.wsInvitationService.getWorkspaceInvitationByToken(
      user.userId,
      user.email,
      invitationToken,
    );
  }
}
