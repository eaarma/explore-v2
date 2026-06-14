import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminLegalDocumentEditor } from "@/src/features/admin/components/AdminLegalDocumentEditor";
import { type AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import {
  getAdminAppConfiguration,
  updateAdminAppConfiguration,
} from "@/src/features/appConfig/appConfigApi";
import { useAppConfigurationStore } from "@/src/features/appConfig/appConfigStore";
import { useResolvedAppConfiguration } from "@/src/features/appConfig/useResolvedAppConfiguration";
import {
  buildPrivacyPolicyDocument,
  buildTermsDocument,
} from "@/src/features/settings/content/legalDocuments";
import type { SettingsDocument } from "@/src/features/settings/components/SettingsDocumentContent";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
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

export function AdminCustomizeSection({
  colors,
}: AdminCustomizeSectionProps) {
  const setConfiguration = useAppConfigurationStore(
    (state) => state.setConfiguration,
  );
  const {
    appTitle,
    contactEmail,
    privacyPolicyVersion,
    termsVersion,
    privacyPolicyDocument,
    termsDocument,
  } = useResolvedAppConfiguration();
  const [activeSection, setActiveSection] =
    useState<CustomizeSectionKey>("main");
  const [pendingAppTitle, setPendingAppTitle] = useState(appTitle);
  const [pendingContactEmail, setPendingContactEmail] = useState(contactEmail);
  const [mainError, setMainError] = useState<string | null>(null);
  const [isSavingMain, setIsSavingMain] = useState(false);
  const [configurationError, setConfigurationError] = useState<string | null>(
    null,
  );
  const [isRefreshingConfiguration, setIsRefreshingConfiguration] =
    useState(false);

  const defaultPrivacyPolicyDocument = useMemo(
    () =>
      buildPrivacyPolicyDocument({
        appTitle,
        contactEmail,
      }),
    [appTitle, contactEmail],
  );
  const defaultTermsDocument = useMemo(
    () =>
      buildTermsDocument({
        appTitle,
        contactEmail,
      }),
    [appTitle, contactEmail],
  );
  const hasCustomPrivacyPolicy = useMemo(
    () =>
      !areDocumentsEqual(
        privacyPolicyDocument,
        defaultPrivacyPolicyDocument,
      ),
    [defaultPrivacyPolicyDocument, privacyPolicyDocument],
  );
  const hasCustomTerms = useMemo(
    () => !areDocumentsEqual(termsDocument, defaultTermsDocument),
    [defaultTermsDocument, termsDocument],
  );

  useEffect(() => {
    setPendingAppTitle(appTitle);
    setPendingContactEmail(contactEmail);
  }, [appTitle, contactEmail]);

  useEffect(() => {
    let isCancelled = false;

    async function loadAdminConfiguration() {
      try {
        setIsRefreshingConfiguration(true);
        const configuration = await getAdminAppConfiguration();

        if (isCancelled) {
          return;
        }

        setConfiguration(configuration);
        setConfigurationError(null);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setConfigurationError(
          getApiErrorMessage(
            error,
            "Couldn't load the latest app customization.",
          ),
        );
      } finally {
        if (!isCancelled) {
          setIsRefreshingConfiguration(false);
        }
      }
    }

    void loadAdminConfiguration();

    return () => {
      isCancelled = true;
    };
  }, [setConfiguration]);

  const normalizedStoredTitle = appTitle.trim();
  const normalizedPendingTitle = pendingAppTitle.trim();
  const normalizedStoredContactEmail = contactEmail.trim();
  const normalizedPendingContactEmail = pendingContactEmail.trim();
  const hasMainChanges =
    normalizedPendingTitle !== normalizedStoredTitle ||
    normalizedPendingContactEmail !== normalizedStoredContactEmail;
  const isMainSaveDisabled =
    isSavingMain || isRefreshingConfiguration || !hasMainChanges;

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
      const configuration = await updateAdminAppConfiguration({
        appTitle: nextAppTitle,
        contactEmail: nextContactEmail,
        privacyPolicyVersion,
        termsVersion,
        privacyPolicyDocument: hasCustomPrivacyPolicy
          ? privacyPolicyDocument
          : buildPrivacyPolicyDocument({
              appTitle: nextAppTitle,
              contactEmail: nextContactEmail,
            }),
        termsDocument: hasCustomTerms
          ? termsDocument
          : buildTermsDocument({
              appTitle: nextAppTitle,
              contactEmail: nextContactEmail,
            }),
      });
      setConfiguration(configuration);

      setMainError(null);
      setConfigurationError(null);
      showAppToast({
        text: "Main customization saved.",
        tone: "success",
      });
    } catch (error) {
      setMainError(
        getApiErrorMessage(error, "Couldn't save the main customization."),
      );
    } finally {
      setIsSavingMain(false);
    }
  }

  async function saveConfigurationUpdate(updatedFields: {
    privacyPolicyDocument?: SettingsDocument;
    termsDocument?: SettingsDocument;
  }) {
    const configuration = await updateAdminAppConfiguration({
      appTitle,
      contactEmail,
      privacyPolicyVersion,
      termsVersion,
      privacyPolicyDocument:
        updatedFields.privacyPolicyDocument ?? privacyPolicyDocument,
      termsDocument: updatedFields.termsDocument ?? termsDocument,
    });

    setConfiguration(configuration);
    setConfigurationError(null);
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
          Choose which customization area you want to work in. Changes here are
          saved globally and used across the app.
        </Text>
      </View>

      {configurationError ? (
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
            {configurationError}
          </Text>
        </View>
      ) : null}

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
              This updates the global app title and legal contact details used
              across the app.
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
                {isSavingMain
                  ? "Saving..."
                  : isRefreshingConfiguration
                    ? "Refreshing..."
                    : "Save main settings"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : activeSection === "privacy-policy" ? (
        <AdminLegalDocumentEditor
          colors={colors}
          currentDocument={privacyPolicyDocument}
          hasOverride={hasCustomPrivacyPolicy}
          onResetToDefault={async () => {
            await saveConfigurationUpdate({
              privacyPolicyDocument: buildPrivacyPolicyDocument({
                appTitle,
                contactEmail,
              }),
            });
          }}
          onSaveDocument={async (document) => {
            await saveConfigurationUpdate({
              privacyPolicyDocument: document,
            });
          }}
          sectionLabel="Privacy policy"
        />
      ) : (
        <AdminLegalDocumentEditor
          colors={colors}
          currentDocument={termsDocument}
          hasOverride={hasCustomTerms}
          onResetToDefault={async () => {
            await saveConfigurationUpdate({
              termsDocument: buildTermsDocument({
                appTitle,
                contactEmail,
              }),
            });
          }}
          onSaveDocument={async (document) => {
            await saveConfigurationUpdate({
              termsDocument: document,
            });
          }}
          sectionLabel="Terms and services"
        />
      )}
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
  secondaryAction: {
    minHeight: 48,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: "700",
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
});

function areDocumentsEqual(left: SettingsDocument, right: SettingsDocument) {
  return JSON.stringify(left) === JSON.stringify(right);
}
