import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '../entities/user.entity';
import { ChangePasswordReqDto } from '../dto/change-password-req.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthUser } from '../decorators/auth-user.decorator';
import { IJwtUserProfile } from '../interfaces/auth-guard-user.interface';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserReqDto } from '../dto/update-user-req.dto';
import { GetUserResDto } from '../dto/get-user-res.dto';

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
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '프로필 조회 완료',
    type: GetUserResDto,
  })
  async getUserByAuthToken(
    @AuthUser() user: IJwtUserProfile,
  ): Promise<GetUserResDto> {
    return await this.userService.getUserById(user.userId);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '프로필 내용 수정' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '프로필 수정 완료',
  })
  async updateMyProfile(
    @AuthUser() user: IJwtUserProfile,
    @Body() updateUserReqDto: UpdateUserReqDto,
  ): Promise<void> {
    await this.userService.updateMyProfile(user.userId, updateUserReqDto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '패스워드 변경' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '패스워드 변경 완료',
  })
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

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '유저 삭제' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '유저 삭제 완료',
  })
  deleteUser(@AuthUser() user: IJwtUserProfile): void {
    this.userService.deleteUser(user.userId);
  }
}
