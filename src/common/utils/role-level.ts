import { ChannelRole } from '../types/channel-role.type';
import { WorkspaceRole } from '../types/workspace-role.type';

export const WorkspaceRoleLevel: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]: 40,
  [WorkspaceRole.MANAGER]: 30,
  [WorkspaceRole.MEMBER]: 20,
  [WorkspaceRole.GUEST]: 10,
};

export const ChannelRoleLevel: Record<ChannelRole, number> = {
  [ChannelRole.MANAGER]: 30,
  [ChannelRole.MEMBER]: 20,
};

const RoleLevel = {
  compareLevel(
    a: WorkspaceRole | ChannelRole,
    b: WorkspaceRole | ChannelRole,
  ): number {
    return WorkspaceRoleLevel[a] - WorkspaceRoleLevel[b];
  },

  isHigherThan(
    a: WorkspaceRole | ChannelRole,
    b: WorkspaceRole | ChannelRole,
  ): boolean {
    return WorkspaceRoleLevel[a] > WorkspaceRoleLevel[b];
  },

  isLowerThan(
    a: WorkspaceRole | ChannelRole,
    b: WorkspaceRole | ChannelRole,
  ): boolean {
    return WorkspaceRoleLevel[a] < WorkspaceRoleLevel[b];
  },
};

export default RoleLevel;
