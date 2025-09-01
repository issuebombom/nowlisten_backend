import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordReqDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
