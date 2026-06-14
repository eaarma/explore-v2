import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type TextInput } from "react-native";

import {
  type AdminUser,
  getAdminUsers,
  updateAdminUser,
} from "@/src/features/admin/api/adminUsersApi";
import {
  buildUserCountCopy,
  createUserEditDraft,
  filterAndSortUsers,
  getPersistableUserName,
  type UserEditDraft,
  type UserRoleFilterKey,
  type UserSortKey,
  type UserStatusFilterKey,
} from "@/src/features/admin/utils/adminUsersModel";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";

export function useAdminUsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<UserSortKey>("alphabetical");
  const [selectedRoles, setSelectedRoles] = useState<UserRoleFilterKey[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    UserStatusFilterKey[]
  >([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isUserDialogVisible, setIsUserDialogVisible] = useState(false);
  const [isDialogEditing, setIsDialogEditing] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userDraft, setUserDraft] = useState<UserEditDraft | null>(null);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const searchInputRef = useRef<TextInput | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const deferredSearchQuery = useDeferredValue(normalizedSearchQuery);
  const activeSearchQuery =
    normalizedSearchQuery.length === 0
      ? normalizedSearchQuery
      : deferredSearchQuery;

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoadingUsers(true);

      try {
        const nextUsers = await getAdminUsers();

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setUsers(nextUsers);
          setUsersError(null);
        });
      } catch {
        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setUsers([]);
          setUsersError("Could not load users right now.");
        });
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(
    () =>
      filterAndSortUsers({
        users,
        searchQuery: activeSearchQuery,
        selectedRoles,
        selectedStatuses,
        sortBy,
      }),
    [activeSearchQuery, selectedRoles, selectedStatuses, sortBy, users],
  );

  const isFiltered =
    activeSearchQuery.length > 0 ||
    selectedRoles.length > 0 ||
    selectedStatuses.length > 0;

  function clearSearchQuery() {
    setSearchQuery("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  function toggleRole(role: UserRoleFilterKey) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function clearRoles() {
    setSelectedRoles([]);
  }

  function toggleStatus(status: UserStatusFilterKey) {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
  }

  function clearStatuses() {
    setSelectedStatuses([]);
  }

  function openUserDialog(user: AdminUser) {
    setSelectedUser(user);
    setUserDraft(createUserEditDraft(user));
    setIsDialogEditing(false);
    setIsRoleMenuOpen(false);
    setIsStatusMenuOpen(false);
    setIsUserDialogVisible(true);
  }

  function closeUserDialog() {
    if (isSavingUser) {
      return;
    }

    setIsUserDialogVisible(false);
    setIsDialogEditing(false);
    setIsRoleMenuOpen(false);
    setIsStatusMenuOpen(false);
    setSelectedUser(null);
    setUserDraft(null);
  }

  function toggleRoleMenu() {
    setIsRoleMenuOpen((currentValue) => !currentValue);
    setIsStatusMenuOpen(false);
  }

  function toggleStatusMenu() {
    setIsStatusMenuOpen((currentValue) => !currentValue);
    setIsRoleMenuOpen(false);
  }

  function updateUserDraft<Field extends keyof UserEditDraft>(
    field: Field,
    value: UserEditDraft[Field],
  ) {
    setUserDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            [field]: value,
          }
        : currentDraft,
    );
  }

  function selectDialogRole(value: UserRoleFilterKey) {
    updateUserDraft("role", value);
    setIsRoleMenuOpen(false);
  }

  function selectDialogStatus(value: UserStatusFilterKey) {
    updateUserDraft("status", value);
    setIsStatusMenuOpen(false);
  }

  async function handlePrimaryDialogAction() {
    if (!selectedUser) {
      return;
    }

    if (!isDialogEditing) {
      setUserDraft(createUserEditDraft(selectedUser));
      setIsDialogEditing(true);
      setIsRoleMenuOpen(false);
      setIsStatusMenuOpen(false);
      return;
    }

    if (!userDraft) {
      return;
    }

    setIsSavingUser(true);

    try {
      const savedUser = await updateAdminUser(selectedUser.id, {
        name: getPersistableUserName(selectedUser),
        role: userDraft.role,
        status: userDraft.status,
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === savedUser.id ? savedUser : user,
        ),
      );
      setSelectedUser(savedUser);
      setUserDraft(createUserEditDraft(savedUser));
      setIsDialogEditing(false);
      setIsRoleMenuOpen(false);
      setIsStatusMenuOpen(false);

      showAppToast({
        text: "The user changes were saved.",
        tone: "success",
      });
    } catch (error) {
      showAppToast({
        text: getApiErrorMessage(
          error,
          "Could not save the user changes right now.",
        ),
        tone: "error",
      });
    } finally {
      setIsSavingUser(false);
    }
  }

  const data = {
    users,
    filteredUsers,
    selectedUser,
    userDraft,
    searchQuery,
    searchInputRef,
    sortBy,
    selectedRoles,
    selectedStatuses,
  };

  const derived = {
    isFiltered,
    summaryCopy: buildUserCountCopy(
      filteredUsers.length,
      users.length,
      isFiltered,
    ),
  };

  const ui = {
    isLoadingUsers,
    usersError,
    isUserDialogVisible,
    isDialogEditing,
    isSavingUser,
    isRoleMenuOpen,
    isStatusMenuOpen,
  };

  const actions = {
    setSearchQuery,
    clearSearchQuery,
    setSortBy,
    toggleRole,
    clearRoles,
    toggleStatus,
    clearStatuses,
    openUserDialog,
    closeUserDialog,
    toggleRoleMenu,
    toggleStatusMenu,
    selectDialogRole,
    selectDialogStatus,
    handlePrimaryDialogAction,
  };

  return {
    data,
    derived,
    ui,
    actions,
  };
}
