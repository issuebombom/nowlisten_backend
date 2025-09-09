import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserReqDto } from '../dto/create-user-req.dto';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateUserResDto } from '../dto/create-user-res.dto';
import { AuthService, JwtToken } from '../services/auth.service';
import { LoginResDto } from '../dto/login-res.dto';
import { LoginReqDto } from '../dto/login-req.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RefreshResDto } from '../dto/refresh-res.dto';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import {
  ISocialUserProfile,
  IJwtUserProfile,
} from '../interfaces/auth-guard-user.interface';
import { AuthUser } from '../decorators/auth-user.decorator';
import { Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { GetTokenReqDto } from '../dto/get-token-req.dto';
import { ForgotPasswordReqDto } from '../dto/forget-password-req.dto';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordReqDto } from '../dto/reset-password-req.dto';
import { VerifyTempTokenReqDto } from '../dto/verify-temp-token-req.dto';
import { SendVerificationEmailReqDto } from '../dto/send-verification-email-req.dto';
import { ConfirmVerificationEmailReqDto } from '../dto/confirm-verification-email-req.dto';
import { RedisNamespace } from 'src/redis/redis-keys';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,

    // ! TEST
    private readonly httpService: HttpService,
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

  @Post('email/verification')
  @ApiOperation({ summary: '인증 메일 발송' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '인증 메일 발송 완료',
  })
  async sendVerificationEmail(
    @Body() dto: SendVerificationEmailReqDto,
  ): Promise<void> {
    await this.authService.sendVerificationEmail(dto.email);
  }

  @Post('email/verification/confirm')
  @ApiOperation({ summary: '인증 번호 확인' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '인증 번호 확인 완료',
  })
  async confirmVerificationEmail(@Body() dto: ConfirmVerificationEmailReqDto) {
    const redisNamespace = RedisNamespace.EMAIL_VERIFY;
    await this.authService.verifyTempToken(redisNamespace, dto.email, dto.code);
  }

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '로그인 완료',
    type: LoginResDto,
  })
  async login(@Body() loginReqDto: LoginReqDto): Promise<LoginResDto> {
    return await this.authService.login(loginReqDto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: '소셜 로그인 페이지 연동' })
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: '구글 oauth2.0 callback' })
  @HttpCode(HttpStatus.FOUND)
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: '프론트엔드 callback으로 리다이렉트 with querystring(code)',
  })
  async googleAuthCallback(
    @AuthUser() user: ISocialUserProfile,
    @Res() res: Response,
  ) {
    const redirectUrl = this.configService.get<string>(
      'FRONT_SOCIAL_LOGIN_REDIRECT',
    );
    const tempToken = await this.authService.googleLogin(user);

    res.redirect(`${redirectUrl}?code=${tempToken}`);
  }

  // ! TEST: 프론트엔드라고 가정한 테스트 엔드포인트 (추후 삭제)
  @Get('callback')
  @ApiExcludeEndpoint()
  async testGetToken(@Query() query: { code: string }, @Res() res: Response) {
    const apiUrl = 'http://localhost:3001/api/v1/auth/social-login/token';
    const requestBody = { token: query.code };
    const requestConfig = {
      headers: { 'Content-Type': 'application/json' },
    };

    const data = await firstValueFrom(
      this.httpService.post(apiUrl, requestBody, requestConfig).pipe(
        map((res) => res.data),
        catchError((err) => {
          console.error(err.message);
          throw new BadRequestException();
        }),
      ),
    );

    res.json(data);
  }

  // 프론트에서 임시 토큰 전달 시 jwt 응답
  @Post('social-login/token')
  @ApiOperation({ summary: '소셜 로그인 후 jwt 발급' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '토큰 발급 완료',
  })
  async getAccessRefresh(
    @Body() getTokenReqDto: GetTokenReqDto,
  ): Promise<JwtToken> {
    const redisNamespace = RedisNamespace.SOCIAL_LOGIN;
    return await this.authService.getAccessRefresh(
      redisNamespace,
      getTokenReqDto.token,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '해당 디바이스에서 로그아웃' })
  @ApiBearerAuth('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '로그아웃 완료',
  })
  logout(@AuthUser() user: IJwtUserProfile): void {
    this.authService.logout(user.jti);
  }

  @Post('logout-all-devices')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '모든 디바이스에서 로그아웃' })
  @ApiBearerAuth('refresh')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '모든 기기 로그아웃 완료',
  })
  logoutAllDevices(@AuthUser() user: IJwtUserProfile): void {
    this.authService.logoutAllDevices(user.userId);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '엑세스 토큰 재발행' })
  @ApiBearerAuth('access')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '엑세스 토큰 재발행 완료',
  })
  async refresh(@AuthUser() user: IJwtUserProfile): Promise<RefreshResDto> {
    return await this.authService.refresh(user);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: '비밀번호 재설정 메일 발송' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '메일 발송 완료',
  })
  async forgotPassword(
    @Body() forgotPasswordReqDto: ForgotPasswordReqDto,
  ): Promise<void> {
    await this.authService.forgotPassword(forgotPasswordReqDto.email);
  }

  @Post('reset-password/verification')
  @ApiOperation({ summary: '임시 토큰 검증' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '토큰 검증 완료',
  })
  // ! NOTE: 비밀번호 재설정 링크 접속 시 해당 링크가 유효한지 토큰으로 검증
  async resetPasswordPageVerification(@Body() dto: VerifyTempTokenReqDto) {
    const redisNamespace = RedisNamespace.PASSWORD_RESET;
    await this.authService.verifyTempToken(redisNamespace, dto.token);
  }

  @Post('reset-password')
  @ApiOperation({ summary: '비밀번호 재설정' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: '비밀번호 재설정 완료',
  })
  async resetPassword(
    @Body() resetPasswordReqDto: ResetPasswordReqDto,
  ): Promise<void> {
    await this.authService.resetPassword(
      resetPasswordReqDto.token,
      resetPasswordReqDto.newPassword,
    );
  }
}
