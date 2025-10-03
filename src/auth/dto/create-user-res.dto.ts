import { BaseResDto } from 'src/common/dto/base-res.dto';
import { User } from '../entities/user.entity';

export class CreateUserResDto extends BaseResDto {
  name: string;
  email: string;
  phone: string;

  static of(user: User): CreateUserResDto {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
