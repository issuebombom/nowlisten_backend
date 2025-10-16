import { VerifyTempTokenReqDto } from '../dto/verify-temp-token-req.dto';

export class AuthResetPasswordEvent extends VerifyTempTokenReqDto {
  email: string;
  username: string;

  constructor(token: string, email: string, username: string) {
    super();
    this.token = token;
    this.email = email;
    this.username = username;
  }
}
