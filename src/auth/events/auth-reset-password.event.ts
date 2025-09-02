import { RedisNamespace } from 'src/redis/redis-keys';
import { VerifyTempTokenReqDto } from '../dto/verify-temp-token-req.dto';

export class AuthResetPasswordEvent extends VerifyTempTokenReqDto {
  email: string;
  username: string;

  constructor(
    namespace: RedisNamespace,
    token: string,
    email: string,
    username: string,
  ) {
    super();
    this.namespace = namespace;
    this.token = token;
    this.email = email;
    this.username = username;
  }
}
