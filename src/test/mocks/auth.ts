import { vi } from "vitest";
import type { AppRole } from "@/types/database";

export interface MockAuthState {
  user: { id: string; email?: string | null } | null;
  session: { user: { id: string } } | null;
  profile: {
    user_id?: string;
    email?: string | null;
    full_name?: string | null;
    department?: string | null;
  } | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  isHR: () => boolean;
}

const defaultState: MockAuthState = {
  user: { id: "user-1", email: "user@example.com" },
  session: { user: { id: "user-1" } },
  profile: {
    user_id: "user-1",
    email: "user@example.com",
    full_name: "Test User",
    department: "admin",
  },
  roles: ["admin"],
  loading: false,
  signOut: vi.fn().mockResolvedValue(undefined),
  hasRole: (role: AppRole) => defaultState.roles.includes(role),
  isAdmin: () => defaultState.roles.includes("admin") || defaultState.roles.includes("super_admin"),
  isSuperAdmin: () => defaultState.roles.includes("super_admin"),
  isHR: () =>
    defaultState.roles.includes("super_admin") ||
    defaultState.roles.includes("admin") ||
    defaultState.roles.includes("hr_manager") ||
    defaultState.roles.includes("hr_officer"),
};

let state: MockAuthState = { ...defaultState };

export const getMockAuth = () => ({
  ...state,
  hasRole: (role: AppRole) => state.roles.includes(role),
  isAdmin: () => state.roles.includes("admin") || state.roles.includes("super_admin"),
  isSuperAdmin: () => state.roles.includes("super_admin"),
  isHR: () =>
    state.roles.includes("super_admin") ||
    state.roles.includes("admin") ||
    state.roles.includes("hr_manager") ||
    state.roles.includes("hr_officer"),
});

export const setMockAuth = (partial: Partial<MockAuthState>) => {
  state = {
    ...state,
    ...partial,
    roles: partial.roles ?? state.roles,
  };
};

export const resetMockAuth = () => {
  state = { ...defaultState };
};
