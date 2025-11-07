import { ApiProperty, PickType } from '@nestjs/swagger';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { MemberStatus } from 'src/common/types/member-status.type';
import { User } from 'src/auth/entities/user.entity';
import { WorkspaceMember } from '../entities/workspace-member.entity';

class UserDto extends PickType(User, ['id', 'email'] as const) {
  @ApiProperty({ description: '유저 ID' })
  id: string;

  @ApiProperty({ description: '유저 이메일' })
  email: string;
}

class MemberDto extends PickType(WorkspaceMember, [
  'id',
  'createdAt',
  'updatedAt',
  'name',
  'role',
  'status',
  'joinedAt',
]) {
  @ApiProperty({ description: '워크스페이스 멤버 ID' })
  id: string;

  @ApiProperty({ description: '워크스페이스 멤버 생성일' })
  createdAt: Date;

  @ApiProperty({ description: '워크스페이스 멤버 업데이트일' })
  updatedAt: Date;

  @ApiProperty({ description: '멤버 닉네임' })
  name: string;

  @ApiProperty({ enum: WorkspaceRole, description: '워크스페이스 멤버 권한' })
  role: WorkspaceRole;

  @ApiProperty({ enum: MemberStatus, description: '멤버 상태' })
  status: MemberStatus;

  @ApiProperty({ description: '워크스페이스 참여일' })
  joinedAt: Date;

  @ApiProperty({ type: UserDto, description: '유저 정보' })
  user: UserDto;
}

export class GetMembersResDto {
  @ApiProperty({ type: [MemberDto], description: '멤버 리스트' })
  result: MemberDto[];

  @ApiProperty({ description: '다음 페이지 존재 여부' })
  isNext: boolean;

  @ApiProperty({ description: '조회 결과 내 마지막 멤버 ID' })
  lastMemberId: string;
}
