import { type AdminUser } from "@/src/features/admin/api/adminUsersApi";
import { normalizeSearchValue } from "@/src/shared/utils/browseSectionUtils";

export const USER_SORT_OPTIONS = [
  { key: "alphabetical", label: "Alphabetical" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
] as const;

export const USER_ROLE_OPTIONS = [
  { key: "ADMIN", label: "Admin" },
  { key: "MANAGER", label: "Manager" },
  { key: "USER", label: "User" },
] as const;

export const USER_STATUS_OPTIONS = [
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
] as const;

const USER_ROLE_ORDER: Record<UserRoleFilterKey, number> = {
  ADMIN: 0,
  MANAGER: 1,
  USER: 2,
};

const USER_STATUS_ORDER: Record<UserStatusFilterKey, number> = {
  ACTIVE: 0,
  INACTIVE: 1,
};

export type UserSortKey = (typeof USER_SORT_OPTIONS)[number]["key"];
export type UserRoleFilterKey = (typeof USER_ROLE_OPTIONS)[number]["key"];
export type UserStatusFilterKey = (typeof USER_STATUS_OPTIONS)[number]["key"];

export type UserEditDraft = {
  role: UserRoleFilterKey;
  status: UserStatusFilterKey;
};

export function filterAndSortUsers({
  users,
  searchQuery,
  selectedRoles,
  selectedStatuses,
  sortBy,
}: {
  users: AdminUser[];
  searchQuery: string;
  selectedRoles: UserRoleFilterKey[];
  selectedStatuses: UserStatusFilterKey[];
  sortBy: UserSortKey;
}) {
  return [...users]
    .filter((user) => {
      if (!matchesUserSearch(user, searchQuery)) {
        return false;
      }

      const roleKey = getUserRoleKey(user.role);
      const statusKey = getUserStatusKey(user.status);

      if (
        selectedRoles.length > 0 &&
        (!roleKey || !selectedRoles.includes(roleKey))
      ) {
        return false;
      }

      if (
        selectedStatuses.length > 0 &&
        (!statusKey || !selectedStatuses.includes(statusKey))
      ) {
        return false;
      }

      return true;
    })
    .sort((left, right) => compareUsers(left, right, sortBy));
}

export function createUserEditDraft(user: AdminUser): UserEditDraft {
  return {
    role: getUserRoleKey(user.role) ?? "USER",
    status: getUserStatusKey(user.status) ?? "ACTIVE",
  };
}

export function getUserRoleKey(
  role: string | null | undefined,
): UserRoleFilterKey | null {
  const normalizedRole =
    typeof role === "string" ? role.trim().toUpperCase() : "";

  if (
    normalizedRole === "ADMIN" ||
    normalizedRole === "MANAGER" ||
    normalizedRole === "USER"
  ) {
    return normalizedRole;
  }

  return null;
}

export function getUserStatusKey(
  status: string | null | undefined,
): UserStatusFilterKey | null {
  const normalizedStatus =
    typeof status === "string" ? status.trim().toUpperCase() : "";

  if (normalizedStatus === "ACTIVE" || normalizedStatus === "INACTIVE") {
    return normalizedStatus;
  }

  return null;
}

export function getUserName(user: Pick<AdminUser, "name" | "email">) {
  const trimmedName = typeof user.name === "string" ? user.name.trim() : "";

  if (trimmedName) {
    return trimmedName;
  }

  const trimmedEmail =
    typeof user.email === "string" ? user.email.trim() : "";

  if (trimmedEmail) {
    return trimmedEmail;
  }

  return "Unnamed user";
}

export function getPersistableUserName(user: Pick<AdminUser, "name" | "email">) {
  return getUserName(user);
}

export function getUserEmail(user: Pick<AdminUser, "email">) {
  const trimmedEmail =
    typeof user.email === "string" ? user.email.trim() : "";

  if (trimmedEmail) {
    return trimmedEmail;
  }

  return "No email available";
}

export function isUserActive(user: Pick<AdminUser, "status">) {
  return getUserStatusKey(user.status) === "ACTIVE";
}

export function formatEnumLabel(
  value: string | null | undefined,
  fallback: string,
) {
  const trimmedValue = typeof value === "string" ? value.trim() : "";

  if (!trimmedValue) {
    return fallback;
  }

  return trimmedValue
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCreatedAt(createdAt: string | null | undefined) {
  const parsedDate =
    typeof createdAt === "string" ? new Date(createdAt) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "unknown";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  const parsedDate = typeof value === "string" ? new Date(value) : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildUserCountCopy(
  filteredCount: number,
  totalCount: number,
  isFiltered: boolean,
) {
  if (isFiltered) {
    return `${filteredCount} of ${totalCount} users`;
  }

  return `${totalCount} users`;
}

export function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? "Select";
}

function matchesUserSearch(user: AdminUser, query: string) {
  if (!query) {
    return true;
  }

  return [user.name, user.email].some((field) =>
    normalizeSearchValue(field).includes(query),
  );
}

function compareUsers(left: AdminUser, right: AdminUser, sortBy: UserSortKey) {
  if (sortBy === "role") {
    const leftRoleOrder = getRoleOrder(left.role);
    const rightRoleOrder = getRoleOrder(right.role);

    if (leftRoleOrder !== rightRoleOrder) {
      return leftRoleOrder - rightRoleOrder;
    }
  }

  if (sortBy === "status") {
    const leftStatusOrder = getStatusOrder(left.status);
    const rightStatusOrder = getStatusOrder(right.status);

    if (leftStatusOrder !== rightStatusOrder) {
      return leftStatusOrder - rightStatusOrder;
    }
  }

  return getUserName(left).localeCompare(getUserName(right));
}

function getRoleOrder(role: string | null | undefined) {
  const roleKey = getUserRoleKey(role);

  if (!roleKey) {
    return Number.MAX_SAFE_INTEGER;
  }

  return USER_ROLE_ORDER[roleKey];
}

function getStatusOrder(status: string | null | undefined) {
  const statusKey = getUserStatusKey(status);

  if (!statusKey) {
    return Number.MAX_SAFE_INTEGER;
  }

  return USER_STATUS_ORDER[statusKey];
}
