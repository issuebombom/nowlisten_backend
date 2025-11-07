import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';

export class UpdateWorkspaceRoleReqDto {
  @IsNotEmpty()
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
