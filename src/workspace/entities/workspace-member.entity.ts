import { User } from 'src/auth/entities/user.entity';
import { BaseEntity } from 'src/common/entities/base-entity';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { Column, Entity, Index, ManyToOne, OneToMany, Relation } from 'typeorm';
import { Workspace } from './workspace.entity';
import { MemberStatus } from 'src/common/types/member-status.type';
import { WorkspaceInvitation } from './workspace-invitation.entity';

@Entity()
@Index(['workspace'])
export class WorkspaceMember extends BaseEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'enum', enum: WorkspaceRole, default: WorkspaceRole.GUEST })
  role: WorkspaceRole;

  @Column({ type: 'enum', enum: MemberStatus })
  status: MemberStatus;

  @Column({ type: 'timestamptz' })
  joinedAt: Date;

  @Column({ type: 'boolean', default: true })
  isReceiveAlert: boolean;

  @OneToMany(() => WorkspaceInvitation, (invitation) => invitation.member)
  invitation: Relation<WorkspaceInvitation>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  workspace: Relation<Workspace>;
}
