import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelMember } from './entities/channel-member.entity';
import { Channel } from './entities/channel.entity';
import { ChannelController } from './controllers/channel.controller';
import { ChannelService } from './services/channel.service';
import { ChannelRepository } from './repositories/channel.repository';
import { ChannelMemberRepository } from './repositories/channel-member.repository';
import { WorkspaceModule } from 'src/workspace/workspace.module';
import { ChannelMemberService } from './services/channel-member.service';

@Module({
  imports: [
    WorkspaceModule,
    TypeOrmModule.forFeature([Channel, ChannelMember]),
  ],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    ChannelMemberService,

    ChannelRepository,
    ChannelMemberRepository,
  ],
  exports: [],
})
export class ChannelModule {}
