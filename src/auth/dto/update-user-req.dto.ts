import { PickType } from '@nestjs/swagger';
import { CreateUserReqDto } from './create-user-req.dto';

export class UpdateUserReqDto extends PickType(CreateUserReqDto, ['name']) {}
