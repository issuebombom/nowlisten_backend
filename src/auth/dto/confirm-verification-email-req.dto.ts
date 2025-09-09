import { IsNotEmpty, IsString } from 'class-validator';
import { SendVerificationEmailReqDto } from './send-verification-email-req.dto';

export class ConfirmVerificationEmailReqDto extends SendVerificationEmailReqDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}
