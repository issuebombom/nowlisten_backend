import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelMember } from '../entities/channel-member.entity';
import { Repository } from 'typeorm';
import { ChannelRole } from 'src/common/types/channel-role.type';
import { WorkspaceMember } from 'src/workspace/entities/workspace-member.entity';
import { Channel } from '../entities/channel.entity';

@Injectable()
export class ChannelMemberRepository {
  constructor(
    @InjectRepository(ChannelMember)
    private readonly repo: Repository<ChannelMember>,
  ) {}

  createChannelMember(
    channelId: string,
    wsMemberId: string,
    role: ChannelRole,
  ) {
    const member = new ChannelMember();
    member.channel = { id: channelId } as Channel;
    member.workspaceMember = { id: wsMemberId } as WorkspaceMember;
    member.role = role;
    member.joinedAt = new Date();
    return this.repo.save(member);
  }
}
