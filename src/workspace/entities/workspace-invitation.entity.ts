import { BaseEntity } from 'src/common/entities/base-entity';
import { InviteStatus } from 'src/common/types/invite-status.type';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { Workspace } from './workspace.entity';
import { WorkspaceMember } from './workspace-member.entity';

@Entity()
export class WorkspaceInvitation extends BaseEntity {
  @Column()
  inviteeEmail: string;

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.INVITED })
  status: InviteStatus;

  @Column({ type: 'timestamptz' })
  invitedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  respondedAt: Date;

  @Column({ type: 'varchar', unique: true })
  token: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => WorkspaceMember, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'member_id' })
  member: Relation<WorkspaceMember>;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Relation<Workspace>;
}
