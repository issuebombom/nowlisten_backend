import { IsLowercase, IsNotEmpty, IsString, Length } from 'class-validator';
import { IsNotReservedWord } from '../decorators/is-not-reservedWord';

export class CreateWorkspaceReqDto {
  @IsLowercase()
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  @IsNotReservedWord()
  workspaceName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  userNickname: string;
}
