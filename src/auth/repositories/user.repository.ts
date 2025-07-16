import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserReqDto } from '../dto/create-user-req.dto';
import { UserRole } from 'src/common/types/user-role.type';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  createUser(dto: CreateUserReqDto, hashedPassword: string): Promise<User> {
    const user = new User();
    user.name = dto.name;
    user.email = dto.email;
    user.password = hashedPassword;
    user.phone = dto.phone;
    user.role = UserRole.User;
    return this.repo.save(user);
  }

  findUserById(id: string): Promise<User> {
    return this.repo.findOneBy({ id });
  }

  findUserByEmail(email: string): Promise<User> {
    return this.repo.findOneBy({ email });
  }

  findUsers(): Promise<User[]> {
    return this.repo.find({ take: 50 });
  }
}
