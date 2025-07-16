import {
  BeforeInsert,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ulid } from 'ulid';

@Entity()
export class BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = ulid();
  }
}
