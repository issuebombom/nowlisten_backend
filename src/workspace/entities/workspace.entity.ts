import { BaseEntity } from 'src/common/entities/base-entity';
import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { WorkspaceMember } from './workspace-member.entity';
import { WorkspaceInvitation } from './workspace-invitation.entity';

@Entity()
export class Workspace extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 100 })
  slug: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  profileImageUrl: string;

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  workspaceMember: Relation<WorkspaceMember>;

  @OneToMany(() => WorkspaceInvitation, (invitation) => invitation.workspace)
  workspaceInvitation: Relation<WorkspaceInvitation>;
}
