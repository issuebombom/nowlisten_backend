export class RefreshResDto {
  access: string;

  constructor(token: { access: string }) {
    this.access = token.access;
  }
}
