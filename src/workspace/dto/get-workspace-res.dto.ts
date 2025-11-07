import { ApiProperty, PickType } from '@nestjs/swagger';
import { WorkspaceMember } from '../entities/workspace-member.entity';
import { Workspace } from '../entities/workspace.entity';

class MemberDto extends PickType(WorkspaceMember, ['id', 'name', 'role']) {}
export class GetWorkspaceResDto extends PickType(Workspace, [
  'id',
  'name',
  'slug',
  'status',
  'profileImageUrl',
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty()
  member: MemberDto;
}
