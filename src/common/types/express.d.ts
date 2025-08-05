import { IAuthGuardUser } from 'src/auth/interfaces/auth-guard-user.interface';

declare module 'express' {
  interface Request {
    user?: IAuthGuardUser;
  }
}
