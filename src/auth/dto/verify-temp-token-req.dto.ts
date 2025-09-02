import { IsNotEmpty, IsString } from 'class-validator';
import { RedisNamespace } from 'src/redis/redis-keys';

export class VerifyTempTokenReqDto {
  @IsNotEmpty()
  @IsString()
  namespace: RedisNamespace;

  @IsNotEmpty()
  @IsString()
  token: string;
}
