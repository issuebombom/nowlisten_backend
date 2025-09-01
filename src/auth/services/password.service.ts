import argon2 from 'argon2';
import { HttpStatus, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';

@Injectable()
export class PasswordService {
  async hashedPassword(plain: string): Promise<string> {
    return await argon2.hash(plain, { type: argon2.argon2id });
  }
  async varifyPassword(plain: string, hashed: string): Promise<void> {
    const verified = await argon2.verify(hashed, plain);
    if (!verified) {
      throw new BusinessException(
        ErrorDomain.Auth,
        'invalid credentials',
        'invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async isSamePassword(plain: string, hashed: string): Promise<void> {
    const verified = await argon2.verify(hashed, plain);
    if (verified) {
      throw new BusinessException(
        ErrorDomain.Auth,
        'New password cannot be the same as the old password.',
        'New password cannot be the same as the old password.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
