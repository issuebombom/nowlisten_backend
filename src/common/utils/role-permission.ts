import { WorkspaceRole } from '../types/workspace-role.type';
import { ChannelRole } from '../types/channel-role.type';

// ! NOTE: 권한 확인 적용 예시
/**
  const userGrade = 7; 
  const requiredRole = RolePermission.WRITE | RolePermission.GET
  if ((userGrade & RolePermission.WRITE) === requiredRole) {
    console.log('권한 있음');
  }
*/

export enum RolePermission {
  // 워크스페이스 관리
  WORKSPACE_INVITE_MEMBER = 1 << 0, // 1
  WORKSPACE_REMOVE_MEMBER = 1 << 1, // 2
  WORKSPACE_MANAGE_MEMBER = 1 << 2, // 4
  WORKSPACE_MANAGE_SETTINGS = 1 << 3, // 8
  WORKSPACE_MANAGE_BILLING = 1 << 4, // 16
  WORKSPACE_MANAGE_APPS = 1 << 5, // 32
  WORKSPACE_MANAGE_CHANNELS = 1 << 6, // 64

  // 채널 관리
  CHANNEL_CREATE = 1 << 7, // 128
  CHANNEL_DELETE = 1 << 8, // 256
  CHANNEL_EDIT = 1 << 9, // 512
  CHANNEL_INVITE_MEMBER = 1 << 10, // 1024
  CHANNEL_REMOVE_MEMBER = 1 << 11, // 2048
  CHANNEL_MANAGE_MESSAGES = 1 << 12, // 4096

  // 메시지/컨텐츠
  MESSAGE_PIN = 1 << 13, // 8192
  MESSAGE_CREATE = 1 << 14, // 16384
  MESSAGE_DELETE = 1 << 15, // 32768
  MESSAGE_EDIT = 1 << 16, // 65536
  MESSAGE_UPLOAD_FILE = 1 << 17, // 131072

  // 유료 컨텐츠 분리
  PLUS_MESSAGE_VIEW_HISTORY = 1 << 18, // 262144

  // 묶음
  WORKSPACE_ALL_PERMISSION = combinePermissionByRegEx(/^WORKSPACE_.*$/),
  CHANNEL_ALL_PERMISSION = combinePermissionByRegEx(/^CHANNEL_.*$/),
  MESSAGE_ALL_PERMISSION = combinePermissionByRegEx(/^MESSAGE_.*$/),
  PLUS_CONTENTS_ALL_PERMISSION = combinePermissionByRegEx(/^PLUS_.*$/),
}

export const WorkspaceRolePermission: Record<WorkspaceRole, number> = {
  [WorkspaceRole.OWNER]:
    RolePermission.WORKSPACE_ALL_PERMISSION |
    RolePermission.CHANNEL_ALL_PERMISSION |
    RolePermission.MESSAGE_ALL_PERMISSION,

  [WorkspaceRole.MANAGER]:
    RolePermission.WORKSPACE_INVITE_MEMBER |
    RolePermission.WORKSPACE_REMOVE_MEMBER |
    RolePermission.WORKSPACE_MANAGE_MEMBER |
    RolePermission.WORKSPACE_MANAGE_CHANNELS |
    RolePermission.CHANNEL_ALL_PERMISSION |
    RolePermission.MESSAGE_ALL_PERMISSION,

  [WorkspaceRole.MEMBER]:
    (RolePermission.CHANNEL_ALL_PERMISSION &
      ~RolePermission.CHANNEL_MANAGE_MESSAGES) |
    RolePermission.MESSAGE_ALL_PERMISSION,

  [WorkspaceRole.GUEST]: RolePermission.MESSAGE_ALL_PERMISSION,
};

// 현재: MANAGE == ws.MEMBER, MEMBER == ws.GUEST
// ! NOTE: 추후 변동성을 위해 중복이지만 분류해 둠
export const ChannelRolePermission: Record<ChannelRole, number> = {
  [ChannelRole.MANAGER]: WorkspaceRolePermission[WorkspaceRole.MEMBER],
  [ChannelRole.MEMBER]: WorkspaceRolePermission[WorkspaceRole.GUEST],
};

function combinePermissionByRegEx(regex: RegExp) {
  return Object.entries(RolePermission)
    .filter(([key]) => regex.test(key))
    .reduce((acc, [, value]) => acc | (value as number), 0);
}

// 권한 비트를 합산
export function combinePermissionByList(permissions: RolePermission[]) {
  return permissions.reduce((acc, value) => acc | value, 0);
}

export function hasWorkspacePermission(
  userRole: WorkspaceRole,
  requiredRole: RolePermission,
): boolean {
  return (WorkspaceRolePermission[userRole] & requiredRole) === requiredRole;
}

export function hasChannelPermission(
  userRole: ChannelRole,
  requiredRole: RolePermission,
): boolean {
  return (ChannelRolePermission[userRole] & requiredRole) === requiredRole;
}
