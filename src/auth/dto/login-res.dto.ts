export class LoginResDto {
  access: string;
  refresh: string;

  constructor(token: { access: string; refresh: string }) {
    this.access = token.access;
    this.refresh = token.refresh;
  }
}
