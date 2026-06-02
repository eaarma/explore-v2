import {
  useEffect,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { type AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import { useAppSettingsStore } from "@/src/features/settings/store/appSettingsStore";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";

type AdminCustomizeSectionProps = {
  colors: AdminColors;
};

const CUSTOMIZE_SECTION_OPTIONS = [
  {
    key: "main",
    label: "Main",
    description: "General app-facing text and shared customization settings.",
  },
  {
    key: "privacy-policy",
    label: "Privacy policy",
    description: "Privacy policy copy and related contact details.",
  },
  {
    key: "terms-and-services",
    label: "Terms and services",
    description: "Terms copy, policy versioning, and legal text settings.",
  },
] as const;

type CustomizeSectionKey = (typeof CUSTOMIZE_SECTION_OPTIONS)[number]["key"];

const PLACEHOLDER_SECTION_CONTENT: Record<
  Exclude<CustomizeSectionKey, "main">,
  {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
  }
> = {
  "privacy-policy": {
    eyebrow: "Privacy policy",
    title: "Privacy policy customization",
    description:
      "Placeholder area for managing privacy policy text, revisions, and contact details.",
    items: [
      "Privacy policy body editor placeholder",
      "Privacy policy last-updated/version placeholder",
      "Privacy policy contact email placeholder",
    ],
  },
  "terms-and-services": {
    eyebrow: "Terms and services",
    title: "Terms and services customization",
    description:
      "Placeholder area for managing Terms of Service content and future legal updates.",
    items: [
      "Terms body editor placeholder",
      "Terms last-updated/version placeholder",
      "Terms contact email placeholder",
    ],
  },
};

export function AdminCustomizeSection({
  colors,
}: AdminCustomizeSectionProps) {
  const appTitle = useAppSettingsStore((state) => state.appTitle);
  const contactEmail = useAppSettingsStore((state) => state.contactEmail);
  const setBrandingSettings = useAppSettingsStore(
    (state) => state.setBrandingSettings,
  );
  const [activeSection, setActiveSection] =
    useState<CustomizeSectionKey>("main");
  const [pendingAppTitle, setPendingAppTitle] = useState(appTitle);
  const [pendingContactEmail, setPendingContactEmail] = useState(contactEmail);
  const [mainError, setMainError] = useState<string | null>(null);
  const [isSavingMain, setIsSavingMain] = useState(false);

  useEffect(() => {
    setPendingAppTitle(appTitle);
    setPendingContactEmail(contactEmail);
  }, [appTitle, contactEmail]);

  const normalizedStoredTitle = appTitle.trim();
  const normalizedPendingTitle = pendingAppTitle.trim();
  const normalizedStoredContactEmail = contactEmail.trim();
  const normalizedPendingContactEmail = pendingContactEmail.trim();
  const hasMainChanges =
    normalizedPendingTitle !== normalizedStoredTitle ||
    normalizedPendingContactEmail !== normalizedStoredContactEmail;
  const isMainSaveDisabled = isSavingMain || !hasMainChanges;

  async function handleSaveMain() {
    const nextAppTitle = pendingAppTitle.trim();
    const nextContactEmail = pendingContactEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (nextAppTitle.length === 0) {
      setMainError("App title is required.");
      return;
    }

    if (!emailPattern.test(nextContactEmail)) {
      setMainError("Please enter a valid contact email address.");
      return;
    }

    try {
      setIsSavingMain(true);

      await setBrandingSettings({
        appTitle: nextAppTitle,
        contactEmail: nextContactEmail,
      });

      setMainError(null);
      showAppToast({
        text: "Main customization saved.",
        tone: "success",
      });
    } finally {
      setIsSavingMain(false);
    }
  }

  return (
    <View style={styles.layout}>
      <View
        style={[
          styles.introCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          Customize
        </Text>
        <Text style={[styles.title, { color: colors.title }]}>
          Customization menu
        </Text>
        <Text style={[styles.description, { color: colors.body }]}>
          Choose which customization area you want to work in. The main section
          is live now, and the policy sections are ready for the next pass.
        </Text>
      </View>

      <View
        style={[
          styles.menuCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.menuTitle, { color: colors.title }]}>
          Sections
        </Text>

        <View style={styles.menuList}>
          {CUSTOMIZE_SECTION_OPTIONS.map((option) => {
            const isActive = option.key === activeSection;

            return (
              <Pressable
                key={option.key}
                accessibilityRole="button"
                onPress={() => setActiveSection(option.key)}
                style={({ pressed }) => [
                  styles.menuOption,
                  {
                    backgroundColor: isActive
                      ? colors.subtleAccent
                      : colors.menuBackground,
                    borderColor: isActive ? colors.accent : colors.cardBorder,
                  },
                  pressed && styles.menuOptionPressed,
                ]}
              >
                <View style={styles.menuOptionCopy}>
                  <Text
                    style={[
                      styles.menuOptionLabel,
                      {
                        color: isActive ? colors.accent : colors.title,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.menuOptionDescription,
                      {
                        color: colors.body,
                      },
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeSection === "main" ? (
        <View
          style={[
            styles.contentCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.eyebrow, { color: colors.accent }]}>Main</Text>
          <Text style={[styles.title, { color: colors.title }]}>
            Main customization
          </Text>
          <Text style={[styles.description, { color: colors.body }]}>
            Manage the app title and the referenced contact email used in legal
            documents.
          </Text>

          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: colors.subtleAccent,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.previewTitle, { color: colors.title }]}>
              {normalizedPendingTitle || "Explore"}
            </Text>
            <Text style={[styles.previewBody, { color: colors.body }]}>
              Legal contact:{" "}
              {normalizedPendingContactEmail || "support@explore.app"}
            </Text>
            <Text style={[styles.previewHint, { color: colors.body }]}>
              This updates the app title and legal contact references used in
              this build.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.body }]}>
              App title
            </Text>
            <TextInput
              onChangeText={(value) => {
                setPendingAppTitle(value);
                setMainError(null);
              }}
              placeholder="App title"
              placeholderTextColor={colors.body}
              style={[
                styles.input,
                {
                  backgroundColor: colors.menuBackground,
                  borderColor: colors.cardBorder,
                  color: colors.title,
                },
              ]}
              value={pendingAppTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.body }]}>
              Referenced email
            </Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(value) => {
                setPendingContactEmail(value);
                setMainError(null);
              }}
              placeholder="contact@example.com"
              placeholderTextColor={colors.body}
              style={[
                styles.input,
                {
                  backgroundColor: colors.menuBackground,
                  borderColor: colors.cardBorder,
                  color: colors.title,
                },
              ]}
              value={pendingContactEmail}
            />
          </View>

          {mainError ? (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: colors.subtleAccent,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: "#B91C1C" }]}>
                {mainError}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={isMainSaveDisabled}
              onPress={() => void handleSaveMain()}
              style={({ pressed }) => [
                styles.primaryAction,
                {
                  backgroundColor: colors.accent,
                },
                pressed && styles.actionPressed,
                isMainSaveDisabled && styles.actionDisabled,
              ]}
            >
              <Text style={styles.primaryActionText}>
                {isSavingMain ? "Saving..." : "Save main settings"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <PlaceholderSectionCard
          colors={colors}
          content={PLACEHOLDER_SECTION_CONTENT[activeSection]}
        />
      )}
    </View>
  );
}

function PlaceholderSectionCard({
  colors,
  content,
}: {
  colors: AdminColors;
  content: {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
  };
}) {
  return (
    <View
      style={[
        styles.contentCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.accent }]}>
        {content.eyebrow}
      </Text>
      <Text style={[styles.title, { color: colors.title }]}>
        {content.title}
      </Text>
      <Text style={[styles.description, { color: colors.body }]}>
        {content.description}
      </Text>

      <View style={styles.placeholderList}>
        {content.items.map((item) => (
          <View
            key={item}
            style={[
              styles.placeholderRow,
              {
                backgroundColor: colors.subtleAccent,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.placeholderDot,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            />
            <Text
              style={[
                styles.placeholderText,
                {
                  color: colors.title,
                },
              ]}
            >
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    gap: 18,
  },
  introCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  menuCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  contentCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  menuList: {
    gap: 10,
  },
  menuOption: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuOptionPressed: {
    opacity: 0.88,
  },
  menuOptionCopy: {
    gap: 4,
  },
  menuOptionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  menuOptionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryAction: {
    minHeight: 48,
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  placeholderList: {
    marginTop: 4,
    gap: 10,
  },
  placeholderRow: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  placeholderDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
