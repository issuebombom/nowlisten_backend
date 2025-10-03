export class WorkspaceCreatedInvitationEvent {
  inviteeEmail: string;
  workspaceName: string;
  inviterName: string;
  inviteToken: string;

  constructor(
    inviteeEmail: string,
    workspaceName: string,
    inviterName: string,
    inviteToken: string,
  ) {
    this.inviteeEmail = inviteeEmail;
    this.workspaceName = workspaceName;
    this.inviterName = inviterName;
    this.inviteToken = inviteToken;
  }
}
