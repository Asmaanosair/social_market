export enum UserRole {
  SUPER_ADMIN = "super_admin",
  TEAM_MANAGER = "team_manager",
  CONTENT_CREATOR = "content_creator",
  ANALYST = "analyst",
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  teamId?: string;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: UserRole;
  user: User;
  joinedAt: Date;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    "manage:team",
    "manage:billing",
    "manage:settings",
    "create:post",
    "edit:post",
    "delete:post",
    "publish:post",
    "view:analytics",
    "export:analytics",
    "manage:accounts",
  ],
  [UserRole.TEAM_MANAGER]: [
    "manage:team",
    "create:post",
    "edit:post",
    "delete:post",
    "publish:post",
    "view:analytics",
    "export:analytics",
    "manage:accounts",
  ],
  [UserRole.CONTENT_CREATOR]: [
    "create:post",
    "edit:post",
    "publish:post",
    "view:analytics",
  ],
  [UserRole.ANALYST]: [
    "view:analytics",
    "export:analytics",
  ],
};
