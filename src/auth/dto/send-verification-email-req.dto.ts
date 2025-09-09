import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendVerificationEmailReqDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
