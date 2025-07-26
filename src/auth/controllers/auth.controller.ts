import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserReqDto } from '../dto/create-user-req.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserResDto } from '../dto/create-user-res.dto';
import { AuthService } from '../services/auth.service';
import { LoginResDto } from '../dto/login-res.dto';
import { LoginReqDto } from '../dto/login-req.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';
import { RefreshResDto } from '../dto/refresh-res.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: '회원 가입' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '유저 생성 완료',
    type: CreateUserResDto,
  })
  async signup(
    @Body() createUserReqDto: CreateUserReqDto,
  ): Promise<CreateUserResDto> {
    return new CreateUserResDto(
      await this.userService.createUser(createUserReqDto),
    );
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '로그인 완료',
    type: LoginResDto,
  })
  async login(@Body() loginReqDto: LoginReqDto): Promise<LoginResDto> {
    return new LoginResDto(await this.authService.login(loginReqDto));
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '해당 디바이스에서ㅅ 로그아웃' })
  @ApiBearerAuth('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '로그아웃 완료',
  })
  logout(@Req() req: Request): void {
    this.authService.logout(req.user.jti);
  }

  @Post('logout-all-devices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '모든 디바이스에서 로그아웃' })
  @ApiBearerAuth('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '모든 기기 로그아웃 완료',
  })
  logoutAllDevices(@Req() req: Request): void {
    const userId = req.user.userId;
    this.authService.logoutAllDevices(userId);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '엑세스 토큰 재발행' })
  @ApiBearerAuth('token')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '엑세스 토큰 재발행 완료',
  })
  async refresh(@Req() req: Request): Promise<RefreshResDto> {
    return new RefreshResDto(this.authService.refresh(req.user.userId));
  }
}
