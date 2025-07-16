import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { ConfigModule } from '@nestjs/config';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [AuthController, UserController],
  providers: [AuthService, UserService, UserRepository],
  exports: [],
})
export class AuthModule {}
