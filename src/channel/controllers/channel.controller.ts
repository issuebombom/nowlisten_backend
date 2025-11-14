import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ChannelService } from '../services/channel.service';
import { ChannelMemberService } from '../services/channel-member.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { IJwtUserProfile } from 'src/auth/interfaces/auth-guard-user.interface';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { CreateChannelReqDto } from '../dto/create-channel-req.dto';

@Controller('ws/:workspaceId/ch')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly channelMemberService: ChannelMemberService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '새 채널 생성' })
  async createChannel(
    @AuthUser() user: IJwtUserProfile,
    @Param('workspaceId') workspaceId: string,
    @Body() createChannelReqDto: CreateChannelReqDto,
  ) {
    return this.channelService.createChannel(
      createChannelReqDto.name,
      workspaceId,
      user.userId,
    );
  }
}
