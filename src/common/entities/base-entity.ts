import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty()
  @PrimaryColumn({ type: 'varchar', length: 26 })
  id: string;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    this.id = ulid();
  }
}
