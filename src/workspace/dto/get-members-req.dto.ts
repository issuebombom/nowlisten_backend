import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetMembersReqDto {
  @Type(() => Number) // string query여서 number로 변경
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number;

  @IsOptional()
  @IsString()
  @Length(26)
  lastMemberId?: string;

  @Type(() => Boolean) // string query여서 boolean으로 변경
  @IsOptional()
  @IsBoolean()
  isNext?: boolean;
}
