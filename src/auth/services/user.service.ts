import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserReqDto } from '../dto/create-user-req.dto';
import { User } from '../entities/user.entity';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import { CreateUserResDto } from '../dto/create-user-res.dto';
import { ISocialUserProfile } from '../interfaces/auth-guard-user.interface';
import { SocialProvider } from 'src/common/types/social-provider.type';
import { PasswordService } from './password.service';
import { UpdateUserReqDto } from '../dto/update-user-req.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly userRepo: UserRepository,
  ) {}

  async createUser(dto: CreateUserReqDto): Promise<CreateUserResDto> {
    const user = await this.userRepo.findUserByEmail(dto.email);
    if (user) {
      if (user.provider !== SocialProvider.LOCAL) {
        throw new BusinessException(
          ErrorDomain.Auth,
          `already exists via social login: ${dto.email}`,
          `email ${dto.email} already exists via social login`,
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new BusinessException(
          ErrorDomain.Auth,
          `already exists: ${dto.email}`,
          `email ${dto.email} already exists`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const hashedPassword = await this.passwordService.hashedPassword(
      dto.password,
    );

    return await this.userRepo.createUser(dto, hashedPassword);
  }

  async createSocialUser(profile: ISocialUserProfile): Promise<User> {
    // 이메일 중복, 소셜 유저 유무 확인
    const user = await this.userRepo.findUserByEmail(profile.email);
    if (!user) {
      const createdUser = await this.userRepo.createSocialUser(profile);
      return createdUser;
    }

    if (user && user.provider === SocialProvider.LOCAL) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `already registered with a local account: ${profile.email}`,
        `email ${profile.email} already registered with a regular account`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepo.findUserByEmail(email);
    if (!user) {
      throw new BusinessException(
        ErrorDomain.User,
        `user not exists: ${email}`,
        `email '${email}' not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async getUserByEmailWithPassword(email: string): Promise<User> {
    const user = await this.userRepo.findUserByEmailWithPassword(email);
    if (!user) {
      throw new BusinessException(
        ErrorDomain.User,
        `user not exists: ${email}`,
        `email '${email}' not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new BusinessException(
        ErrorDomain.User,
        `user not exists: ${id}`,
        `ID '${id}' not exists`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  // !NOTE: 배포 단계에서는 사용 금지
  async getUsers(): Promise<User[]> {
    return await this.userRepo.findUsers();
  }

  async updateMyProfile(
    id: string,
    updateProfile: UpdateUserReqDto,
  ): Promise<void> {
    await this.userRepo.updateUser(id, updateProfile);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    /**
     * 구현 내역
     * 해당 회원이 존재하는지 확인 (가드에서 이미 검증)
     * 회원 정보에서 패스워드 획득
     * 기존 패스워드에 대한 검증 필요
     * 새 패스워드 해시화
     * 패드워드 변경 적용
     */

    const user = await this.userRepo.findUserById(id);
    await this.passwordService.comparePassword(currentPassword, user.password);
    const newHashedPassword =
      await this.passwordService.hashedPassword(newPassword);
    await this.userRepo.updatePassword(id, newHashedPassword);
  }

  deleteUser(id: string): void {
    this.userRepo.deleteUser(id);
  }
}
