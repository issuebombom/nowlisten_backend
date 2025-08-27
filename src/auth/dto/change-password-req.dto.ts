import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsPassword } from '../decorators/is-password.decorator';

export class ChangePasswordReqDto {
  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  currentPassword: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  @IsPassword()
  newPassword: string;
}
