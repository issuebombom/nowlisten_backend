import { HttpStatus, Injectable } from '@nestjs/common';
import { ChannelRepository } from '../repositories/channel.repository';
import { WorkspaceService } from 'src/workspace/services/workspace.service';
import { WorkspaceStatus } from 'src/common/types/workspace-status.type';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { WorkspaceMemberService } from 'src/workspace/services/workspace-member.service';
import { RolePermission } from 'src/common/utils/role-permission';
import { Channel } from '../entities/channel.entity';
import { Transactional } from 'typeorm-transactional';
import { ChannelVisibility } from 'src/common/types/channel-visibility.type';
import { ChannelRole } from 'src/common/types/channel-role.type';
import { ChannelMemberRepository } from '../repositories/channel-member.repository';

@Injectable()
export class ChannelService {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly wsMemberService: WorkspaceMemberService,
    private readonly channelRepo: ChannelRepository,
    private readonly chMemberRepo: ChannelMemberRepository,
  ) {}

  async createChannel(
    name: string,
    workspaceId: string,
    userId: string,
    visibility?: ChannelVisibility,
  ) {
    // 워크스페이스 존재유무 & 활성화 체크
    const workspace = await this.workspaceService.getWorkspaceById(workspaceId);
    if (workspace.status !== WorkspaceStatus.ACTIVE) {
      throw new BusinessException(
        ErrorDomain.Channel,
        `workspace is inactive: ${workspaceId}`,
        `workspace is inactive`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 채널 생성 자격 검증
    const wsMember = await this.wsMemberService.hasRequiredRolePermission(
      RolePermission.CHANNEL_CREATE,
      userId,
      workspaceId,
    );

    // ! NOTE: 채널명 규칙 설정 (양쪽 끝 trim 적용 & 띄어쓰기 "언더바"로 대체)
    const modifiedName = name.trim().replaceAll(' ', '_');

    // 워크스페이스 내 채널명 중복 체크
    const channels = await this.findChannelsByWsId(workspaceId);
    const isExistName = channels.find((channel) => {
      return channel.name === modifiedName;
    });
    if (isExistName) {
      throw new BusinessException(
        ErrorDomain.Channel,
        `channel name already exists: ${modifiedName}`,
        `channel name [${modifiedName}] already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // [트랜잭션] 채널 생성 + 채널 멤버 생성
    const channel = await this.createChannelAndMember(
      modifiedName,
      workspace.id,
      wsMember.id,
      visibility,
    );

    return channel;
  }

  async findChannelById(channelId: string): Promise<Channel> {
    const channel = await this.channelRepo.findChannelById(channelId);
    if (channel) {
      throw new BusinessException(
        ErrorDomain.Channel,
        `channel not exists: ${channelId}`,
        `channel not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return channel;
  }

  private async findChannelsByWsId(workspaceId: string): Promise<Channel[]> {
    return await this.channelRepo.findChannelsByWsId(workspaceId);
  }

  @Transactional()
  private async createChannelAndMember(
    channelName: string,
    workspaceId: string,
    wsMemberId: string,
    visibility?: ChannelVisibility,
  ) {
    // 채널 생성
    const channel = await this.channelRepo.createChannel(
      channelName,
      workspaceId,
      visibility,
    );
    // 채널 멤버 생성
    await this.chMemberRepo.createChannelMember(
      channel.id,
      wsMemberId,
      ChannelRole.MANAGER,
    );

    return channel;
  }
}
