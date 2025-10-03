import { InviteStatus } from 'src/common/types/invite-status.type';
import { MemberStatus } from 'src/common/types/member-status.type';
import { WorkspaceRole } from 'src/common/types/workspace-role.type';
import { WorkspaceStatus } from 'src/common/types/workspace-status.type';

export class GetInvitationInfoResDto {
  id: string;
  inviteeEmail: string;
  status: InviteStatus;
  invitedAt: Date;
  token: string;
  expiresAt: Date;
  member: {
    id: string;
    name: string;
    role: WorkspaceRole;
    status: MemberStatus;
  };
  workspace: {
    id: string;
    name: string;
    status: WorkspaceStatus;
  };
}
