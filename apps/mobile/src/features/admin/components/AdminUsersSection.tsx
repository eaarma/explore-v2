import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";

import { type AdminUser } from "@/src/features/admin/api/adminUsersApi";
import {
  AdminUserCard,
  AdminUsersEmptyState,
  AdminUsersHeader,
  UserDetailsDialog,
} from "@/src/features/admin/components/AdminUsersSectionParts";
import { useAdminUsersSection } from "@/src/features/admin/hooks/useAdminUsersSection";
import { type AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import { useAdminUsersSectionStyles } from "@/src/features/admin/utils/adminUsersTheme";

type AdminUsersSectionProps = {
  colors: AdminColors;
};

export function AdminUsersSection({ colors }: AdminUsersSectionProps) {
  const styles = useAdminUsersSectionStyles(colors);
  const {
    data: {
      users,
      filteredUsers,
      selectedUser,
      userDraft,
      searchQuery,
      searchInputRef,
      sortBy,
      selectedRoles,
      selectedStatuses,
    },
    derived: { isFiltered },
    ui: {
      isLoadingUsers,
      usersError,
      isUserDialogVisible,
      isDialogEditing,
      isSavingUser,
      isRoleMenuOpen,
      isStatusMenuOpen,
    },
    actions: {
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
    },
  } = useAdminUsersSection();

  return (
    <>
      <FlashList<AdminUser>
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AdminUserCard user={item} styles={styles} onPress={openUserDialog} />
        )}
        ItemSeparatorComponent={() => <View style={styles.listSpacer} />}
        ListHeaderComponent={
          <AdminUsersHeader
            searchInputRef={searchInputRef}
            searchQuery={searchQuery}
            sortBy={sortBy}
            selectedRoles={selectedRoles}
            selectedStatuses={selectedStatuses}
            filteredCount={filteredUsers.length}
            totalCount={users.length}
            isFiltered={isFiltered}
            isLoadingUsers={isLoadingUsers}
            usersError={usersError}
            placeholderTextColor={colors.body}
            styles={styles}
            onChangeSearchQuery={setSearchQuery}
            onClearSearchQuery={clearSearchQuery}
            onChangeSortBy={setSortBy}
            onToggleRole={toggleRole}
            onClearRoles={clearRoles}
            onToggleStatus={toggleStatus}
            onClearStatuses={clearStatuses}
          />
        }
        ListEmptyComponent={
          <AdminUsersEmptyState
            isLoadingUsers={isLoadingUsers}
            usersError={usersError}
            isFiltered={isFiltered}
            styles={styles}
          />
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
        onRoleMenuToggle={toggleRoleMenu}
        onStatusMenuToggle={toggleStatusMenu}
        onRoleSelect={selectDialogRole}
        onStatusSelect={selectDialogStatus}
      />
    </>
  );
}
