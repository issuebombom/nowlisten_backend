import { IsEnum, IsNotEmpty } from 'class-validator';
import { MemberStatus } from 'src/common/types/member-status.type';

export class UpdateMemberStatusReqDto {
  @IsNotEmpty()
  @IsEnum(MemberStatus)
  status: MemberStatus;
}
