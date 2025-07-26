import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginReqDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
