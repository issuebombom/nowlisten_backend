import { IsNotEmpty, IsString } from 'class-validator';

export class GetTokenReqDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;
}
