import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Channel } from '../entities/channel.entity';
import { Repository } from 'typeorm';
import { ChannelVisibility } from 'src/common/types/channel-visibility.type';
import { Workspace } from 'src/workspace/entities/workspace.entity';

@Injectable()
export class ChannelRepository {
  constructor(
    @InjectRepository(Channel)
    private readonly repo: Repository<Channel>,
  ) {}

  createChannel(
    name: string,
    workspaceId: string,
    visibility?: ChannelVisibility,
  ) {
    const channel = new Channel();
    channel.name = name;
    channel.workspace = { id: workspaceId } as Workspace;
    if (visibility) channel.visibility = visibility;
    return this.repo.save(channel);
  }

  findChannelsByWsId(workspaceId: string): Promise<Channel[]> {
    return this.repo.find({ where: { workspace: { id: workspaceId } } });
  }

  findChannelById(id: string): Promise<Channel> {
    return this.repo.findOneBy({ id });
  }
}
