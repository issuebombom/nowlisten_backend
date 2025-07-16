import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateUserReqDto {
  @IsString()
  @Length(1, 50)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  @Length(1, 50)
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  password: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 30)
  phone: string;
}
