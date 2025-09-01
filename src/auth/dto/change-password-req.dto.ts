import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsPassword } from '../decorators/is-password.decorator';

export class ChangePasswordReqDto {
  @IsNotEmpty()
  @IsString()
  @Length(8, 255)
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 255)
  @IsPassword()
  newPassword: string;
}
