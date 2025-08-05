import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly repo: Repository<RefreshToken>,
  ) {}

  saveRefreshToken(
    jti: string,
    expiresAt: Date,
    user: User,
  ): Promise<RefreshToken> {
    const token = new RefreshToken();
    token.jti = jti;
    token.expiresAt = expiresAt;
    token.user = user;
    return this.repo.save(token);
  }

  delete(jti: string): void {
    this.repo.delete({ jti });
  }
  deleteAll(userId: string): void {
    this.repo.delete({ user: { id: userId } });
  }

  async getRefreshTokenByUserId(userId: string): Promise<RefreshToken[]> {
    return await this.repo
      .createQueryBuilder('token')
      .leftJoinAndSelect('token.user', 'user')
      .where('token.user.id = :userId', { userId })
      .andWhere('token.expiresAt > NOW()')
      .getMany();
  }

  async getRefreshTokenByJti(jti: string): Promise<RefreshToken> {
    return await this.repo.findOneBy({ jti });
  }

  async getRefreshTokens(): Promise<RefreshToken[]> {
    return await this.repo.find();
  }

  async removeExpiredTokens(): Promise<void> {
    await this.repo
      .createQueryBuilder('token')
      .delete()
      .from(RefreshToken)
      .where('expiresAt < NOW()')
      .execute();
  }
}
