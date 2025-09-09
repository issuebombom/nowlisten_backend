import { AuthMethod } from 'src/common/types/auth-method.type';

export class AuthSendVerificationCodeEvent {
  method: AuthMethod;
  credential: string;
  code: string;

  constructor(method: AuthMethod, credential: string, code: string) {
    this.method = method;
    this.credential = credential;
    this.code = code;
  }
}
