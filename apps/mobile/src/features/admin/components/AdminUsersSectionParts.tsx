import { type RefObject } from "react";
import { type TextInput, Modal, Pressable, ScrollView, Text, View } from "react-native";

import { type AdminUser } from "@/src/features/admin/api/adminUsersApi";
import {
  buildUserCountCopy,
  createUserEditDraft,
  formatCreatedAt,
  formatDateTime,
  formatEnumLabel,
  getSelectOptionLabel,
  getUserEmail,
  getUserName,
  isUserActive,
  USER_ROLE_OPTIONS,
  USER_SORT_OPTIONS,
  USER_STATUS_OPTIONS,
  type UserEditDraft,
  type UserRoleFilterKey,
  type UserSortKey,
  type UserStatusFilterKey,
} from "@/src/features/admin/utils/adminUsersModel";
import { type AdminUsersSectionStyles } from "@/src/features/admin/utils/adminUsersTheme";
import {
  SectionCategorySelector,
  SectionChipSelector,
  SectionSearchField,
} from "@/src/shared/components/SectionControls";

type AdminUsersHeaderProps = {
  searchInputRef: RefObject<TextInput | null>;
  searchQuery: string;
  sortBy: UserSortKey;
  selectedRoles: UserRoleFilterKey[];
  selectedStatuses: UserStatusFilterKey[];
  filteredCount: number;
  totalCount: number;
  isFiltered: boolean;
  isLoadingUsers: boolean;
  usersError: string | null;
  placeholderTextColor: string;
  styles: AdminUsersSectionStyles;
  onChangeSearchQuery: (value: string) => void;
  onClearSearchQuery: () => void;
  onChangeSortBy: (value: UserSortKey) => void;
  onToggleRole: (role: UserRoleFilterKey) => void;
  onClearRoles: () => void;
  onToggleStatus: (status: UserStatusFilterKey) => void;
  onClearStatuses: () => void;
};

export function AdminUsersHeader({
  searchInputRef,
  searchQuery,
  sortBy,
  selectedRoles,
  selectedStatuses,
  filteredCount,
  totalCount,
  isFiltered,
  isLoadingUsers,
  usersError,
  placeholderTextColor,
  styles,
  onChangeSearchQuery,
  onClearSearchQuery,
  onChangeSortBy,
  onToggleRole,
  onClearRoles,
  onToggleStatus,
  onClearStatuses,
}: AdminUsersHeaderProps) {
  return (
    <View style={styles.content}>
      <SectionSearchField
        inputRef={searchInputRef}
        value={searchQuery}
        onChangeText={onChangeSearchQuery}
        onClear={onClearSearchQuery}
        placeholder="Search by name or email"
        placeholderTextColor={placeholderTextColor}
        styles={styles}
      />

      <SectionChipSelector
        label="Sort"
        activeKey={sortBy}
        options={USER_SORT_OPTIONS}
        onSelect={onChangeSortBy}
        styles={styles}
      />

      <SectionCategorySelector
        allLabel="All roles"
        label="Role"
        options={USER_ROLE_OPTIONS}
        selectedKeys={selectedRoles}
        onToggle={onToggleRole}
        onClear={onClearRoles}
        styles={styles}
      />

      <SectionCategorySelector
        allLabel="All statuses"
        label="Status"
        options={USER_STATUS_OPTIONS}
        selectedKeys={selectedStatuses}
        onToggle={onToggleStatus}
        onClear={onClearStatuses}
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
            {buildUserCountCopy(filteredCount, totalCount, isFiltered)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

type AdminUserCardProps = {
  user: AdminUser;
  styles: AdminUsersSectionStyles;
  onPress: (user: AdminUser) => void;
};

export function AdminUserCard({
  user,
  styles,
  onPress,
}: AdminUserCardProps) {
  return (
    <View style={styles.listItemContainer}>
      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userIdentity}>
            <Text style={styles.userName}>{getUserName(user)}</Text>
            <Text style={styles.userEmail}>{getUserEmail(user)}</Text>
          </View>
        </View>

        <View style={styles.userMetaRow}>
          <View style={[styles.metaPill, styles.rolePill]}>
            <Text style={[styles.metaPillText, styles.rolePillText]}>
              {formatEnumLabel(user.role, "Unknown role")}
            </Text>
          </View>

          <View
            style={[
              styles.metaPill,
              isUserActive(user)
                ? styles.statusPillActive
                : styles.statusPillInactive,
            ]}
          >
            <Text
              style={[
                styles.metaPillText,
                isUserActive(user)
                  ? styles.statusPillTextActive
                  : styles.statusPillTextInactive,
              ]}
            >
              {formatEnumLabel(user.status, "Unknown status")}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.userCreatedAt}>
            Created {formatCreatedAt(user.createdAt)}
          </Text>

          <Pressable
            onPress={() => onPress(user)}
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
  );
}

type AdminUsersEmptyStateProps = {
  isLoadingUsers: boolean;
  usersError: string | null;
  isFiltered: boolean;
  styles: AdminUsersSectionStyles;
};

export function AdminUsersEmptyState({
  isLoadingUsers,
  usersError,
  isFiltered,
  styles,
}: AdminUsersEmptyStateProps) {
  if (isLoadingUsers || usersError) {
    return null;
  }

  return (
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
  );
}

type UserDetailsDialogProps = {
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
};

export function UserDetailsDialog({
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
}: UserDetailsDialogProps) {
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
                    onSelect={(value) => onStatusSelect(value as UserStatusFilterKey)}
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
