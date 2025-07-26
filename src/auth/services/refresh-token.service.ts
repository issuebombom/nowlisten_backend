import { Injectable, Logger } from '@nestjs/common';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../entities/user.entity';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  private readonly logger = new Logger(RefreshTokenService.name);

  saveRefreshToken(jti: string, expiresAt: Date, user: User) {
    this.refreshTokenRepo.saveRefreshToken(jti, expiresAt, user);
  }

  async hasToken(jti: string): Promise<boolean> {
    const found = this.refreshTokenRepo.getRefreshTokenByJti(jti);
    return !!found;
  }

  revokeRefreshToken(jti: string): void {
    this.refreshTokenRepo.delete(jti);
  }

  revokeAllRefreshTokens(userId: string): void {
    this.refreshTokenRepo.deleteAll(userId);
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: 'remove-expired-refresh',
    timeZone: 'Asia/Seoul',
  })
  async removeExpiredTokens(): Promise<void> {
    await this.refreshTokenRepo.removeExpiredTokens();
    this.logger.log('Executed query to delete expired tokens');
  }
}
