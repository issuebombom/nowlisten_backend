import { PickType } from '@nestjs/swagger';
import { LoginReqDto } from './login-req.dto';

export class DeleteUserReqDto extends PickType(LoginReqDto, ['password']) {}
