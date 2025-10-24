import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsNotReservedWord } from '../decorators/is-not-reservedWord';

export class UpdateWorkspaceNameReqDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  @IsNotReservedWord()
  workspaceName: string;
}
