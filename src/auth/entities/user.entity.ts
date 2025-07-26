import { BaseEntity } from 'src/common/entities/base-entity';
import { UserRole } from 'src/common/types/user-role.type';
import { Column, Entity, OneToMany, Relation } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.User })
  role: UserRole;

  @OneToMany(() => RefreshToken, (token) => token.user, { cascade: ['remove'] })
  refreshToken: Relation<RefreshToken>;
}
