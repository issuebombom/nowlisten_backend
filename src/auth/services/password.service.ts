import argon2 from 'argon2';
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';

@Injectable()
export class PasswordService {
  async hashedPassword(plain: string): Promise<string> {
    return await argon2.hash(plain, { type: argon2.argon2id });
  }
  async comparePassword(plain: string, hashed: string): Promise<void> {
    const verified = await argon2.verify(hashed, plain);
    if (!verified) {
      throw new BusinessException(
        ErrorDomain.Auth,
        'invalid credentials',
        'invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }
    console.log(verified);
  }
}
