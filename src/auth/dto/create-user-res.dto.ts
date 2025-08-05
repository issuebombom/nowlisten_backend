import { BaseResDto } from 'src/common/dto/base-res.dto';
import { User } from '../entities/user.entity';

export class CreateUserResDto extends BaseResDto {
  name: string;
  email: string;
  phone: string;

  // Res body
  constructor(user: Partial<User>) {
    super();
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.phone = user.phone;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
