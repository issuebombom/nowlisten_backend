import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { WorkspaceStatus } from 'src/common/types/workspace-status.type';

export class GetWorkspaceResDto {
  id: string;
  name: string;
  slug: string;
  status: WorkspaceStatus;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  memberName: string;
  memberRole: WorkspaceRole;
}
