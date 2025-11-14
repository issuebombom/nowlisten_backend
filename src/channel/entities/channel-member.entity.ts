import { BaseEntity } from 'src/common/entities/base-entity';
import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { ChannelRole } from 'src/common/types/channel-role.type';
import { MemberStatus } from 'src/common/types/member-status.type';
import { Channel } from './channel.entity';
import { WorkspaceMember } from 'src/workspace/entities/workspace-member.entity';

@Entity()
export class ChannelMember extends BaseEntity {
  @Column({ type: 'enum', enum: ChannelRole, default: ChannelRole.MEMBER })
  role: ChannelRole;

  @Column({ type: 'enum', enum: MemberStatus, default: MemberStatus.ACTIVE })
  status: MemberStatus;

  @Column({ type: 'timestamptz' })
  joinedAt: Date;

  @Column({ type: 'boolean', default: true, select: false })
  isReceiveAlert: boolean;

  @ManyToOne(() => Channel, { onDelete: 'CASCADE' })
  channel: Relation<Channel>;

  @ManyToOne(() => WorkspaceMember, { onDelete: 'CASCADE' })
  workspaceMember: Relation<WorkspaceMember>;
}
