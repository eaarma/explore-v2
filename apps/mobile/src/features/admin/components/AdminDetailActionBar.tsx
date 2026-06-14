import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { InlineFeedbackCard } from "@/src/shared/components/InlineFeedbackCard";

type AdminDetailActionBarProps = {
  formError: string | null;
  isEditing: boolean;
  isSaving: boolean;
  saveLabel?: string;
  primaryViewLabel?: string;
  moreActionsAccessibilityLabel: string;
  secondaryIconColor: string;
  onSave: () => void;
  onPrimaryViewAction: () => void;
  onMoreActions?: () => void;
  onBack: () => void;
  styles: {
    actionRow: StyleProp<ViewStyle>;
    actionButton: StyleProp<ViewStyle>;
    actionButtonPrimary: StyleProp<ViewStyle>;
    actionButtonSecondary: StyleProp<ViewStyle>;
    actionIconButton: StyleProp<ViewStyle>;
    actionButtonDisabled: StyleProp<ViewStyle>;
    actionButtonText: StyleProp<TextStyle>;
    actionButtonTextPrimary: StyleProp<TextStyle>;
    actionButtonTextSecondary: StyleProp<TextStyle>;
  };
};

export function AdminDetailActionBar({
  formError,
  isEditing,
  isSaving,
  saveLabel = "Save changes",
  primaryViewLabel = "Show on map",
  moreActionsAccessibilityLabel,
  secondaryIconColor,
  onSave,
  onPrimaryViewAction,
  onMoreActions,
  onBack,
  styles,
}: AdminDetailActionBarProps) {
  return (
    <>
      {formError ? <InlineFeedbackCard message={formError} /> : null}

      <View style={styles.actionRow}>
        {isEditing ? (
          <Pressable
            onPress={onSave}
            disabled={isSaving}
            style={[
              styles.actionButton,
              styles.actionButtonPrimary,
              isSaving && styles.actionButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonTextPrimary,
              ]}
            >
              {isSaving ? "Saving..." : saveLabel}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={onPrimaryViewAction}
            style={[styles.actionButton, styles.actionButtonPrimary]}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonTextPrimary,
              ]}
            >
              {primaryViewLabel}
            </Text>
          </Pressable>
        )}

        {!isEditing && onMoreActions ? (
          <Pressable
            accessibilityLabel={moreActionsAccessibilityLabel}
            accessibilityRole="button"
            onPress={onMoreActions}
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              styles.actionIconButton,
            ]}
          >
            <Ionicons
              color={secondaryIconColor}
              name="ellipsis-horizontal"
              size={20}
            />
          </Pressable>
        ) : null}

        <Pressable
          onPress={onBack}
          disabled={isSaving}
          style={[styles.actionButton, styles.actionButtonSecondary]}
        >
          <Text
            style={[
              styles.actionButtonText,
              styles.actionButtonTextSecondary,
            ]}
          >
            Back
          </Text>
        </Pressable>
      </View>
    </>
  );
}
