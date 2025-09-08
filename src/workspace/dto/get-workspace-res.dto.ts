import { WorkspaceRole } from 'src/common/types/workspace-role.type';

export class GetWorkspaceResDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  memberName: string;
  memberRole: WorkspaceRole;
}
