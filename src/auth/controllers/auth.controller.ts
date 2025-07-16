import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserReqDto } from '../dto/create-user-req.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserResDto } from '../dto/create-user-res.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

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
}
