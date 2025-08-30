import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateWorkspaceReqDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  workspaceName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  userNickname: string;
}
