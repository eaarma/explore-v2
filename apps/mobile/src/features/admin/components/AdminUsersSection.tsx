import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FlashList } from "@shopify/flash-list";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  type AdminUser,
  updateAdminUser,
  getAdminUsers,
} from "@/src/features/admin/api/adminUsersApi";
import { type AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import {
  SectionCategorySelector,
  SectionChipSelector,
  SectionSearchField,
} from "@/src/shared/components/SectionControls";
import { useColorScheme } from "@/src/shared/hooks/use-color-scheme";
import { normalizeSearchValue } from "@/src/shared/utils/browseSectionUtils";

const USER_SORT_OPTIONS = [
  { key: "alphabetical", label: "Alphabetical" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
] as const;

const USER_ROLE_OPTIONS = [
  { key: "ADMIN", label: "Admin" },
  { key: "MANAGER", label: "Manager" },
  { key: "USER", label: "User" },
] as const;

const USER_STATUS_OPTIONS = [
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

type UserSortKey = (typeof USER_SORT_OPTIONS)[number]["key"];
type UserRoleFilterKey = (typeof USER_ROLE_OPTIONS)[number]["key"];
type UserStatusFilterKey = (typeof USER_STATUS_OPTIONS)[number]["key"];

type AdminUsersSectionProps = {
  colors: AdminColors;
};

type UserEditDraft = {
  role: UserRoleFilterKey;
  status: UserStatusFilterKey;
};

type AdminUsersSectionStyles = ReturnType<typeof createStyles>;

export function AdminUsersSection({ colors }: AdminUsersSectionProps) {
  const styles = useAdminUsersSectionStyles(colors);
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

  const filteredUsers = useMemo(() => {
    return [...users]
      .filter((user) => {
        if (!matchesUserSearch(user, activeSearchQuery)) {
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
  }, [activeSearchQuery, selectedRoles, selectedStatuses, sortBy, users]);

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

  function toggleStatus(status: UserStatusFilterKey) {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    );
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

      Alert.alert("User saved", "The user changes were saved.");
    } catch (error) {
      Alert.alert(
        "Save failed",
        getApiErrorMessage(error, "Could not save the user changes right now."),
      );
    } finally {
      setIsSavingUser(false);
    }
  }

  return (
    <>
      <FlashList<AdminUser>
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItemContainer}>
            <View style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userIdentity}>
                  <Text style={styles.userName}>{getUserName(item)}</Text>
                  <Text style={styles.userEmail}>{getUserEmail(item)}</Text>
                </View>
              </View>

              <View style={styles.userMetaRow}>
                <View style={[styles.metaPill, styles.rolePill]}>
                  <Text style={[styles.metaPillText, styles.rolePillText]}>
                    {formatEnumLabel(item.role, "Unknown role")}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metaPill,
                    isUserActive(item)
                      ? styles.statusPillActive
                      : styles.statusPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.metaPillText,
                      isUserActive(item)
                        ? styles.statusPillTextActive
                        : styles.statusPillTextInactive,
                    ]}
                  >
                    {formatEnumLabel(item.status, "Unknown status")}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.userCreatedAt}>
                  Created {formatCreatedAt(item.createdAt)}
                </Text>

                <Pressable
                  onPress={() => openUserDialog(item)}
                  style={({ pressed }) => [
                    styles.viewButton,
                    pressed && styles.viewButtonPressed,
                  ]}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
        ListHeaderComponent={
          <View style={styles.content}>
            <SectionSearchField
              inputRef={searchInputRef}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onClear={clearSearchQuery}
              placeholder="Search by name or email"
              placeholderTextColor={colors.body}
              styles={styles}
            />

            <SectionChipSelector
              label="Sort"
              activeKey={sortBy}
              options={USER_SORT_OPTIONS}
              onSelect={setSortBy}
              styles={styles}
            />

            <SectionCategorySelector
              allLabel="All roles"
              label="Role"
              options={USER_ROLE_OPTIONS}
              selectedKeys={selectedRoles}
              onToggle={toggleRole}
              onClear={() => setSelectedRoles([])}
              styles={styles}
            />

            <SectionCategorySelector
              allLabel="All statuses"
              label="Status"
              options={USER_STATUS_OPTIONS}
              selectedKeys={selectedStatuses}
              onToggle={toggleStatus}
              onClear={() => setSelectedStatuses([])}
              styles={styles}
            />

            {isLoadingUsers ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Loading users</Text>
                <Text style={styles.stateCopy}>
                  Pulling the account list for admin review.
                </Text>
              </View>
            ) : null}

            {!isLoadingUsers && usersError ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>Users unavailable</Text>
                <Text style={styles.stateCopy}>{usersError}</Text>
              </View>
            ) : null}

            {!isLoadingUsers && !usersError ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTitle}>Users</Text>
                <Text style={styles.summaryMeta}>
                  {buildUserCountCopy(
                    filteredUsers.length,
                    users.length,
                    isFiltered,
                  )}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoadingUsers && !usersError ? (
            <View style={styles.listItemContainer}>
              <View style={styles.stateCard}>
                <Text style={styles.stateTitle}>No users found</Text>
                <Text style={styles.stateCopy}>
                  {isFiltered
                    ? "No users match the current search and filters."
                    : "No users are available yet."}
                </Text>
              </View>
            </View>
          ) : null
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <UserDetailsDialog
        user={selectedUser}
        draft={userDraft}
        isVisible={isUserDialogVisible}
        isEditing={isDialogEditing}
        isSaving={isSavingUser}
        isRoleMenuOpen={isRoleMenuOpen}
        isStatusMenuOpen={isStatusMenuOpen}
        styles={styles}
        onClose={closeUserDialog}
        onPrimaryPress={() => void handlePrimaryDialogAction()}
        onRoleMenuToggle={() => {
          setIsRoleMenuOpen((currentValue) => !currentValue);
          setIsStatusMenuOpen(false);
        }}
        onStatusMenuToggle={() => {
          setIsStatusMenuOpen((currentValue) => !currentValue);
          setIsRoleMenuOpen(false);
        }}
        onRoleSelect={(value) => {
          updateUserDraft("role", value);
          setIsRoleMenuOpen(false);
        }}
        onStatusSelect={(value) => {
          updateUserDraft("status", value);
          setIsStatusMenuOpen(false);
        }}
      />
    </>
  );
}

function UserDetailsDialog({
  user,
  draft,
  isVisible,
  isEditing,
  isSaving,
  isRoleMenuOpen,
  isStatusMenuOpen,
  styles,
  onClose,
  onPrimaryPress,
  onRoleMenuToggle,
  onStatusMenuToggle,
  onRoleSelect,
  onStatusSelect,
}: {
  user: AdminUser | null;
  draft: UserEditDraft | null;
  isVisible: boolean;
  isEditing: boolean;
  isSaving: boolean;
  isRoleMenuOpen: boolean;
  isStatusMenuOpen: boolean;
  styles: AdminUsersSectionStyles;
  onClose: () => void;
  onPrimaryPress: () => void;
  onRoleMenuToggle: () => void;
  onStatusMenuToggle: () => void;
  onRoleSelect: (value: UserRoleFilterKey) => void;
  onStatusSelect: (value: UserStatusFilterKey) => void;
}) {
  if (!user) {
    return null;
  }

  const editableValues = draft ?? createUserEditDraft(user);

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.dialogOverlay}>
        <View style={styles.dialogCard}>
          <ScrollView
            contentContainerStyle={styles.dialogContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogEyebrow}>Admin user</Text>
              <Text style={styles.dialogTitle}>{getUserName(user)}</Text>
              <Text style={styles.dialogSubtitle}>{getUserEmail(user)}</Text>
              {isEditing ? (
                <Text style={styles.dialogHint}>
                  Update the dropdown fields below and save when you are ready.
                </Text>
              ) : null}
            </View>

            <View style={styles.dialogSection}>
              <Text style={styles.dialogSectionTitle}>User details</Text>
              <MetadataRow label="ID" value={user.id} styles={styles} />
              <MetadataRow label="Name" value={getUserName(user)} styles={styles} />
              <MetadataRow
                label="Email"
                value={getUserEmail(user)}
                styles={styles}
              />
              <MetadataRow
                label="Created at"
                value={formatDateTime(user.createdAt)}
                styles={styles}
              />
              {isEditing ? (
                <>
                  <EditableSelectField
                    label="Role"
                    value={editableValues.role}
                    options={USER_ROLE_OPTIONS}
                    isOpen={isRoleMenuOpen}
                    onToggle={onRoleMenuToggle}
                    onSelect={(value) => onRoleSelect(value as UserRoleFilterKey)}
                    styles={styles}
                  />
                  <EditableSelectField
                    label="Status"
                    value={editableValues.status}
                    options={USER_STATUS_OPTIONS}
                    isOpen={isStatusMenuOpen}
                    onToggle={onStatusMenuToggle}
                    onSelect={(value) =>
                      onStatusSelect(value as UserStatusFilterKey)
                    }
                    styles={styles}
                  />
                </>
              ) : (
                <>
                  <MetadataRow
                    label="Role"
                    value={formatEnumLabel(user.role, "Unknown role")}
                    styles={styles}
                  />
                  <MetadataRow
                    label="Status"
                    value={formatEnumLabel(user.status, "Unknown status")}
                    styles={styles}
                  />
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.dialogButtonRow}>
            <Pressable
              onPress={onPrimaryPress}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.dialogButton,
                styles.dialogButtonPrimary,
                isSaving && styles.dialogButtonDisabled,
                pressed && styles.dialogButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.dialogButtonText,
                  styles.dialogButtonTextPrimary,
                ]}
              >
                {isEditing ? (isSaving ? "Saving..." : "Save") : "Edit"}
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.dialogButton,
                styles.dialogButtonSecondary,
                isSaving && styles.dialogButtonDisabled,
                pressed && styles.dialogButtonPressed,
              ]}
            >
              <Text
                style={[
                  styles.dialogButtonText,
                  styles.dialogButtonTextSecondary,
                ]}
              >
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type MetadataRowProps = {
  label: string;
  value: string;
  styles: AdminUsersSectionStyles;
};

function MetadataRow({ label, value, styles }: MetadataRowProps) {
  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <Text style={styles.metadataValue}>{value}</Text>
    </View>
  );
}

type EditableSelectFieldProps = {
  label: string;
  value: string;
  options: readonly { key: string; label: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  styles: AdminUsersSectionStyles;
};

function EditableSelectField({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
  styles,
}: EditableSelectFieldProps) {
  const selectedLabel = getSelectOptionLabel(value, options);

  return (
    <View style={styles.metadataRow}>
      <Text style={styles.metadataLabel}>{label}</Text>

      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.selectButton,
          isOpen && styles.selectButtonOpen,
          pressed && styles.selectButtonPressed,
        ]}
      >
        <Text style={styles.selectButtonText}>{selectedLabel}</Text>
        <Text style={styles.selectButtonChevron}>{isOpen ? "^" : "v"}</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.selectMenu}>
          {options.map((option) => {
            const isSelected = option.key === value;

            return (
              <Pressable
                key={option.key}
                onPress={() => onSelect(option.key)}
                style={({ pressed }) => [
                  styles.selectOption,
                  isSelected && styles.selectOptionSelected,
                  pressed && styles.selectOptionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    isSelected && styles.selectOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function useAdminUsersSectionStyles(colors: AdminColors) {
  const colorScheme = useColorScheme();

  return useMemo(
    () => createStyles(colors, colorScheme === "dark"),
    [colorScheme, colors],
  );
}

function createStyles(colors: AdminColors, isDark: boolean) {
  const neutralText = isDark ? "#CBD5E1" : "#334155";
  const mutedText = isDark ? "#94A3B8" : "#64748B";
  const inactiveBackground = isDark ? "#111827" : "#F8FAFC";
  const inactiveBorder = isDark ? "#334155" : "#CBD5E1";
  const inactiveText = isDark ? "#CBD5E1" : "#475569";
  const overlayBackground = isDark
    ? "rgba(2, 6, 23, 0.78)"
    : "rgba(15, 23, 42, 0.26)";

  return StyleSheet.create({
    scrollView: {
      flex: 1,
    },
    content: {
      paddingTop: 24,
      paddingHorizontal: 15,
      paddingBottom: 18,
      gap: 18,
    },
    listContent: {
      paddingBottom: 32,
    },
    listItemContainer: {
      paddingHorizontal: 15,
    },
    listSpacer: {
      height: 12,
    },
    searchInputWrapper: {
      position: "relative",
      justifyContent: "center",
    },
    searchInput: {
      height: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingRight: 52,
      color: colors.title,
      fontSize: 15,
    },
    searchInputClearButton: {
      position: "absolute",
      right: 11,
      width: 30,
      height: 30,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    searchInputClearButtonText: {
      color: neutralText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    controlBlock: {
      gap: 10,
    },
    controlLabel: {
      color: mutedText,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    segmentedRow: {
      flexDirection: "row",
      gap: 10,
    },
    segmentButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingVertical: 12,
    },
    segmentButtonActive: {
      borderColor: colors.accent,
      backgroundColor: colors.subtleAccent,
    },
    segmentButtonText: {
      color: neutralText,
      fontSize: 15,
      fontWeight: "700",
    },
    segmentButtonTextActive: {
      color: colors.accent,
    },
    chipRow: {
      gap: 10,
      paddingRight: 20,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    filterChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.subtleAccent,
    },
    filterChipText: {
      color: neutralText,
      fontSize: 14,
      fontWeight: "600",
    },
    filterChipTextActive: {
      color: colors.accent,
    },
    stateCard: {
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      padding: 18,
    },
    stateTitle: {
      color: colors.title,
      fontSize: 18,
      fontWeight: "700",
    },
    stateCopy: {
      marginTop: 8,
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingTop: 2,
    },
    summaryTitle: {
      color: colors.title,
      fontSize: 24,
      fontWeight: "700",
    },
    summaryMeta: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    userCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      padding: 16,
      gap: 12,
    },
    userHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
    },
    userIdentity: {
      flex: 1,
      gap: 4,
    },
    userName: {
      color: colors.title,
      fontSize: 17,
      fontWeight: "700",
      lineHeight: 22,
    },
    userEmail: {
      color: colors.body,
      fontSize: 14,
      lineHeight: 20,
    },
    userMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    metaPill: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    metaPillText: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.35,
    },
    rolePill: {
      borderColor: colors.accent,
      backgroundColor: colors.subtleAccent,
    },
    rolePillText: {
      color: colors.accent,
    },
    statusPillActive: {
      borderColor: colors.accent,
      backgroundColor: colors.subtleAccent,
    },
    statusPillInactive: {
      borderColor: inactiveBorder,
      backgroundColor: inactiveBackground,
    },
    statusPillTextActive: {
      color: colors.accent,
    },
    statusPillTextInactive: {
      color: inactiveText,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    userCreatedAt: {
      flex: 1,
      color: mutedText,
      fontSize: 13,
      fontWeight: "500",
    },
    viewButton: {
      minWidth: 74,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    viewButtonPressed: {
      opacity: 0.84,
    },
    viewButtonText: {
      color: neutralText,
      fontSize: 14,
      fontWeight: "700",
    },
    dialogOverlay: {
      flex: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: overlayBackground,
    },
    dialogCard: {
      maxHeight: "86%",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    dialogContent: {
      padding: 20,
      gap: 18,
    },
    dialogHeader: {
      gap: 6,
    },
    dialogEyebrow: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    dialogTitle: {
      color: colors.title,
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 30,
    },
    dialogSubtitle: {
      color: colors.body,
      fontSize: 15,
      lineHeight: 22,
    },
    dialogHint: {
      paddingTop: 2,
      color: colors.body,
      fontSize: 14,
      lineHeight: 21,
    },
    dialogSection: {
      gap: 12,
    },
    dialogSectionTitle: {
      color: colors.title,
      fontSize: 16,
      fontWeight: "700",
    },
    metadataRow: {
      gap: 8,
    },
    metadataLabel: {
      color: mutedText,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    metadataValue: {
      color: colors.title,
      fontSize: 15,
      lineHeight: 22,
    },
    selectButton: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    selectButtonOpen: {
      borderColor: colors.accent,
    },
    selectButtonPressed: {
      opacity: 0.88,
    },
    selectButtonText: {
      flex: 1,
      color: colors.title,
      fontSize: 15,
      fontWeight: "600",
    },
    selectButtonChevron: {
      color: colors.body,
      fontSize: 14,
      fontWeight: "700",
    },
    selectMenu: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
      overflow: "hidden",
    },
    selectOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    selectOptionSelected: {
      backgroundColor: colors.subtleAccent,
    },
    selectOptionPressed: {
      opacity: 0.84,
    },
    selectOptionText: {
      color: neutralText,
      fontSize: 14,
      fontWeight: "600",
    },
    selectOptionTextSelected: {
      color: colors.accent,
    },
    dialogButtonRow: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 4,
    },
    dialogButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    dialogButtonPrimary: {
      backgroundColor: colors.accent,
    },
    dialogButtonSecondary: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.background,
    },
    dialogButtonDisabled: {
      opacity: 0.6,
    },
    dialogButtonPressed: {
      opacity: 0.84,
    },
    dialogButtonText: {
      fontSize: 14,
      fontWeight: "700",
    },
    dialogButtonTextPrimary: {
      color: isDark ? "#022C22" : "#FFFFFF",
    },
    dialogButtonTextSecondary: {
      color: neutralText,
    },
  });
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

function getUserRoleKey(
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

function getUserStatusKey(
  status: string | null | undefined,
): UserStatusFilterKey | null {
  const normalizedStatus =
    typeof status === "string" ? status.trim().toUpperCase() : "";

  if (normalizedStatus === "ACTIVE" || normalizedStatus === "INACTIVE") {
    return normalizedStatus;
  }

  return null;
}

function createUserEditDraft(user: AdminUser): UserEditDraft {
  return {
    role: getUserRoleKey(user.role) ?? "USER",
    status: getUserStatusKey(user.status) ?? "ACTIVE",
  };
}

function getUserName(user: Pick<AdminUser, "name" | "email">) {
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

function getPersistableUserName(user: Pick<AdminUser, "name" | "email">) {
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

function getUserEmail(user: Pick<AdminUser, "email">) {
  const trimmedEmail =
    typeof user.email === "string" ? user.email.trim() : "";

  if (trimmedEmail) {
    return trimmedEmail;
  }

  return "No email available";
}

function isUserActive(user: Pick<AdminUser, "status">) {
  return getUserStatusKey(user.status) === "ACTIVE";
}

function formatEnumLabel(
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

function formatCreatedAt(createdAt: string | null | undefined) {
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

function formatDateTime(value: string | null | undefined) {
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

function buildUserCountCopy(
  filteredCount: number,
  totalCount: number,
  isFiltered: boolean,
) {
  if (isFiltered) {
    return `${filteredCount} of ${totalCount} users`;
  }

  return `${totalCount} users`;
}

function getSelectOptionLabel(
  value: string,
  options: readonly { key: string; label: string }[],
) {
  return options.find((option) => option.key === value)?.label ?? "Select";
}
