import { BaseEntity } from 'src/common/entities/base-entity';
import { UserRole } from 'src/common/types/user-role.type';
import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { SocialProvider } from 'src/common/types/social-provider.type';
import { WorkspaceMember } from 'src/workspace/entities/workspace-member.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false, nullable: true })
  password: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Column({ type: 'enum', enum: SocialProvider, default: SocialProvider.LOCAL })
  provider: SocialProvider;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshToken: Relation<RefreshToken>;

  @OneToMany(() => WorkspaceMember, (member) => member.user)
  workspaceMember: Relation<WorkspaceMember>;
}
