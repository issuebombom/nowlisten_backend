import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserReqDto } from '../dto/create-user-req.dto';
import { User } from '../entities/user.entity';
import { BusinessException } from 'src/exception/business-exception';
import { ErrorDomain } from 'src/common/types/error-domain.type';
import argon2 from 'argon2';
import { CreateUserResDto } from '../dto/create-user-res.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async createUser(dto: CreateUserReqDto): Promise<CreateUserResDto> {
    const user = await this.userRepo.findUserByEmail(dto.email);
    if (user) {
      throw new BusinessException(
        ErrorDomain.Auth,
        `already exists: ${dto.email}`,
        `email ${dto.email} already exists`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    return await this.userRepo.createUser(dto, hashedPassword);
  }

  // !NOTE: 배포 단계에서는 사용 금지
  async getUserById(id: string): Promise<User> {
    return await this.userRepo.findUserById(id);
  }

  // !NOTE: 배포 단계에서는 사용 금지
  async getUsers(): Promise<User[]> {
    return await this.userRepo.findUsers();
  }
}
