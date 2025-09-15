import { User } from 'src/auth/entities/user.entity';
import { BaseEntity } from 'src/common/entities/base-entity';
import { InviteStatus } from 'src/common/types/invite-status.type';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';
import { Workspace } from './workspace.entity';

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

  @Column({ type: 'varchar' })
  token: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_user_id' })
  user: Relation<User>;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Relation<Workspace>;
}
