import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
import { ApproveInvitationReqDto } from '../dto/approve-invitation-req.dto';
import { getInvitationResDto } from '../dto/get-invitation-res.dto';
import { UpdateWorkspaceNameReqDto } from '../dto/update-workspace-name-req.dto';
import { UpdateWorkspaceSlugReqDto } from '../dto/update-workspace-slug-req.dto';
import { UpdateWorkspaceStatusReqDto } from '../dto/update-workspace-status.dto';
import { GetMembersReqDto } from '../dto/get-members-req.dto';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { ConfigService } from '@nestjs/config';

@Controller('ws')
export class WorkspaceController {
  constructor(
    private readonly configService: ConfigService,
    private readonly workspaceService: WorkspaceService,
    private readonly wsMemberService: WorkspaceMemberService,
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

  @Patch(':workspaceId/name')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '워크스페이스 이름 변경' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크스페이스 이름 변경 완료',
  })
  async updateWorkspaceName(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: IJwtUserProfile,
    @Body() updateworkspaceNameReqDto: UpdateWorkspaceNameReqDto,
  ): Promise<void> {
    await this.workspaceService.updateWorkspaceName(
      updateworkspaceNameReqDto.workspaceName,
      workspaceId,
      user.userId,
    );
  }

  @Patch(':workspaceId/slug')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '워크스페이스 슬러그 변경' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크스페이스 슬러그 변경 완료',
  })
  async updateWorkspaceSlug(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: IJwtUserProfile,
    @Body() updateworkspaceSlugReqDto: UpdateWorkspaceSlugReqDto,
  ): Promise<void> {
    await this.workspaceService.updateWorkspaceSlug(
      updateworkspaceSlugReqDto.slug,
      workspaceId,
      user.userId,
    );
  }

  @Patch(':workspaceId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '워크스페이스 상태 변경' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크스페이스 상태 변경 완료',
  })
  async updateWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: IJwtUserProfile,
    @Body() updateWorkspaceStatusReqDto: UpdateWorkspaceStatusReqDto,
  ): Promise<void> {
    await this.workspaceService.updateWorkspaceStatus(
      updateWorkspaceStatusReqDto.status,
      workspaceId,
      user.userId,
    );
  }

  @Delete(':workspaceId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '지정 워크스페이스 삭제' })
  async deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: IJwtUserProfile,
  ): Promise<void> {
    await this.workspaceService.deleteWorkspaceById(user.userId, workspaceId);
  }

  @Get(':workspaceId/invitations/me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '워크스페이스 내 초대 목록 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크스페이스 조회 완료',
    type: getInvitationResDto,
    isArray: true,
  })
  async getMyInvitations(
    @AuthUser() user: IJwtUserProfile,
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkspaceInvitation[]> {
    return await this.wsInvitationService.getMyWorkspaceInvitations(
      user.userId,
      workspaceId,
    );
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
    await this.wsInvitationService.createWorkspaceInvitation(
      user.userId,
      dto.inviteeEmail,
      dto.workspaceId,
    );
  }

  // 초대받은 유저가 ws join 페이지 접속 시 보여 줄 초대 관련 정보
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
    return await this.wsInvitationService.getInvitationInfo(
      user.email,
      invitationToken,
    );
  }

  // 초대 수락(참여하기)
  @Post('invite/:token/join/approve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '초대 승인' })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: '초대 승인 완료',
  })
  async approveInvitation(
    @AuthUser() user: IJwtUserProfile,
    @Param('token') invitationToken: string,
    @Body() approveInvitationReqDto: ApproveInvitationReqDto,
  ): Promise<void> {
    await this.wsInvitationService.approveInvitation(
      user.userId,
      user.email,
      invitationToken,
      approveInvitationReqDto.nickname,
    );
  }

  // 초대 거절(참여 거절)
  @Patch('invite/:token/join/reject')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '초대 거절' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '초대 거절 완료',
  })
  async rejectInvitation(
    @AuthUser() user: IJwtUserProfile,
    @Param('token') invitationToken: string,
  ): Promise<void> {
    await this.wsInvitationService.rejectInvitation(
      user.email,
      invitationToken,
    );
  }

  // 초대 생성자의 취소
  @Patch('invite/:token/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '초대 취소' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '초대 상태 취소 변경',
  })
  async cancelInvitation(
    @Param('token') invitationToken: string,
    @AuthUser() user: IJwtUserProfile,
  ): Promise<void> {
    await this.wsInvitationService.cancelInvitation(
      user.userId,
      invitationToken,
    );
  }

  // 워크스페이스 맴버 조회
  @Get(':workspaceId/members')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '워크스페이스 맴버 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '워크스페이스 맴버 리스트 전달',
  })
  async getWorkspaceMembers(
    @AuthUser() user: IJwtUserProfile,
    @Param('workspaceId') workspaceId: string,
    @Query() getMembersReqDto: GetMembersReqDto,
  ) {
    const MAX_LIMIT = parseInt(
      this.configService.get<string>('GET_WORKSPACE_MEMBERS_LIMIT'),
    );
    return await this.wsMemberService.getWorkspaceMembers(
      user.userId,
      workspaceId,
      getMembersReqDto.limit <= MAX_LIMIT ? getMembersReqDto.limit : MAX_LIMIT, // 디폴트 제한 20
      getMembersReqDto.isNext,
      getMembersReqDto.lastMemberId,
    );
  }
}
