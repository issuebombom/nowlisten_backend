import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteUserByEmailReqDto {
  @IsNotEmpty()
  @IsEmail()
  inviteeEmail: string;

  @IsNotEmpty()
  @IsString()
  workspaceId: string;
}
