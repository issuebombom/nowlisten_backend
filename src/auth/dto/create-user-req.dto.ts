import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { IsPassword } from '../decorators/is-password.decorator';

export class CreateUserReqDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 255)
  @IsPassword()
  password: string;

  @IsString()
  @Length(1, 30)
  phone: string;
}
