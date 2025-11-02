import { PickType } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class CreateUserResDto extends PickType(User, [
  'id',
  'name',
  'email',
  'phone',
  'createdAt',
  'updatedAt',
]) {}
