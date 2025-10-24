import { IsNotEmpty, IsString, Length } from 'class-validator';
import { IsNotReservedWord } from '../decorators/is-not-reservedWord';

export class UpdateWorkspaceSlugReqDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 100)
  @IsNotReservedWord()
  slug: string;
}
