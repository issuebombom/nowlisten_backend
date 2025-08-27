import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { IsPassword } from '../decorators/is-password.decorator';

export class LoginReqDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  @IsPassword()
  password: string;
}
