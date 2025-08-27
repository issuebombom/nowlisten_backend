import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { ChangePasswordReqDto } from '../dto/change-password-req.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthUser } from '../decorators/auth-user.decorator';
import { IJwtUserProfile } from '../interfaces/auth-guard-user.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ! DEBUG
  @Get()
  async getUsers(): Promise<User[]> {
    return await this.userService.getUsers();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getUserByAuthToken(@AuthUser() user: IJwtUserProfile): Promise<User> {
    return await this.userService.getUserById(user.userId);
  }

  @Patch('me/password')
  @ApiOperation({ summary: '패스워드 변경' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '패스워드 변경 완료',
  })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @AuthUser() user: IJwtUserProfile,
    @Body()
    changePasswordReqDto: ChangePasswordReqDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordReqDto;
    await this.userService.changePassword(
      user.userId,
      currentPassword,
      newPassword,
    );
  }
}
