import { InviteStatus } from 'src/common/types/invite-status.type';

export class getInvitationResDto {
  id: string;
  inviteeEmail: string;
  status: InviteStatus;
  invitedAt: Date;
  respondedAt?: Date;
  token: string;
  expiredsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
