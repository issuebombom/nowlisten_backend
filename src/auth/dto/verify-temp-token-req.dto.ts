import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyTempTokenReqDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsString()
  @IsOptional()
  compareValue?: string;
}
