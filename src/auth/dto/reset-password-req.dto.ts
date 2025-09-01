import { PickType } from '@nestjs/swagger';
import { ChangePasswordReqDto } from './change-password-req.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordReqDto extends PickType(ChangePasswordReqDto, [
  'newPassword',
]) {
  @IsNotEmpty()
  @IsString()
  token: string;
}
