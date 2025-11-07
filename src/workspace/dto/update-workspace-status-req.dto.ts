import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceStatus } from 'src/common/types/workspace-status.type';

export class UpdateWorkspaceStatusReqDto {
  @IsNotEmpty()
  @IsEnum(WorkspaceStatus)
  status: WorkspaceStatus;
}
