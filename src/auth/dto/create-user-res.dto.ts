import { BaseResDto } from 'src/common/dto/base-res.dto';

export class CreateUserResDto extends BaseResDto {
  name: string;
  email: string;
  phone: string;
}
