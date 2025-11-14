import { BaseEntity } from 'src/common/entities/base-entity';
import { ChannelStatus } from 'src/common/types/channel-status.type';
import { ChannelVisibility } from 'src/common/types/channel-visibility.type';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { Column, Entity, ManyToOne, OneToMany, Relation } from 'typeorm';
import { ChannelMember } from './channel-member.entity';

@Entity()
export class Channel extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'enum', enum: ChannelStatus, default: ChannelStatus.ACTIVE })
  status: ChannelStatus;

  @Column({
    type: 'enum',
    enum: ChannelVisibility,
    default: ChannelVisibility.PUBLIC,
  })
  visibility: ChannelVisibility;

  @OneToMany(() => ChannelMember, (member) => member.channel)
  member: Relation<ChannelMember>;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Relation<Workspace>;
}
