import { BaseEntity } from 'src/common/entities/base-entity';
import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class RefreshToken extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  jti: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ManyToOne(() => User)
  user: Relation<User>;
}
