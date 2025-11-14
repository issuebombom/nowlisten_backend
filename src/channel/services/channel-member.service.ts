import { Injectable } from '@nestjs/common';
import { ChannelMemberRepository } from '../repositories/channel-member.repository';

@Injectable()
export class ChannelMemberService {
  constructor(private readonly channelMemberRepo: ChannelMemberRepository) {}
}
