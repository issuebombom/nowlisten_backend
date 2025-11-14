import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChannelReqDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
