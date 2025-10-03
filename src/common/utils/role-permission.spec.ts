import {
  ChannelRolePermission,
  RolePermission,
  WorkspaceRolePermission,
} from './role-permission';

describe('rolePermission', () => {
  it('워크스페이스 오너와 매니저의 권한 차이는 워크스페이스 SETTING, BILLING, APPS 권한에 있다.', () => {
    const permissions =
      RolePermission.WORKSPACE_MANAGE_SETTINGS |
      RolePermission.WORKSPACE_MANAGE_BILLING |
      RolePermission.WORKSPACE_MANAGE_APPS;
    const result =
      (WorkspaceRolePermission.owner & ~permissions) ===
      WorkspaceRolePermission.manager;
    expect(result).toBeTruthy();
  });

  it('워크스페이스 멤버는 워크스페이스의 대한 어떠한 권한에도 접근할 수 없다.', () => {
    const permissions = RolePermission.WORKSPACE_ALL_PERMISSION;
    const result = WorkspaceRolePermission.member & permissions;
    expect(result).toBe(0);
  });

  it('워크스페이스 멤버는 채널 내 메시지 매니징 권한에 접근할 수 없다.', () => {
    const permission = RolePermission.CHANNEL_MANAGE_MESSAGES;
    const result = WorkspaceRolePermission.member & permission;
    expect(result).toBe(0);
  });

  it('워크스페이스 게스트는 워크스페이스, 채널에 대한 어떠한 권한에도 접근할 수 없다.', () => {
    const permissions =
      RolePermission.WORKSPACE_ALL_PERMISSION |
      RolePermission.CHANNEL_ALL_PERMISSION;
    const result = WorkspaceRolePermission.guest & permissions;
    expect(result).toBe(0);
  });

  it('채널 매니저는 워크스페이스 멤버와 권한이 동일하다', () => {
    const result =
      ChannelRolePermission.manager === WorkspaceRolePermission.member;
    expect(result).toBeTruthy();
  });

  it('채널 멤버는 워크스페이스 게스트와 권한이 동일하다', () => {
    const result =
      ChannelRolePermission.member === WorkspaceRolePermission.guest;
    expect(result).toBeTruthy();
  });

  it('기본적으로 모든 유저는 PLUS 컨텐츠에 접근할 수 없다.', () => {
    const result =
      (WorkspaceRolePermission.owner &
        RolePermission.PLUS_CONTENTS_ALL_PERMISSION) |
      (WorkspaceRolePermission.manager &
        RolePermission.PLUS_CONTENTS_ALL_PERMISSION) |
      (WorkspaceRolePermission.member &
        RolePermission.PLUS_CONTENTS_ALL_PERMISSION) |
      (WorkspaceRolePermission.guest &
        RolePermission.PLUS_CONTENTS_ALL_PERMISSION) |
      (ChannelRolePermission.manager &
        RolePermission.PLUS_CONTENTS_ALL_PERMISSION) |
      (ChannelRolePermission.member &
        RolePermission.PLUS_CONTENTS_ALL_PERMISSION);
    expect(result).toBe(0);
  });
});
