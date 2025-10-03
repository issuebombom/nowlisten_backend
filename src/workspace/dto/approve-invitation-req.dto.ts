import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveInvitationReqDto {
  @IsNotEmpty()
  @IsString()
  nickname: string;
}
