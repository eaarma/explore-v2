import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { AdminColors } from "@/src/features/admin/utils/adminScreenTheme";
import type { SettingsDocument } from "@/src/features/settings/components/SettingsDocumentContent";
import { getApiErrorMessage } from "@/src/shared/api/apiError";
import { showAppToast } from "@/src/shared/store/appFeedbackStore";

type AdminLegalDocumentEditorProps = {
  colors: AdminColors;
  currentDocument: SettingsDocument;
  hasOverride: boolean;
  onResetToDefault: () => Promise<void>;
  onSaveDocument: (document: SettingsDocument) => Promise<void>;
  sectionLabel: "Privacy policy" | "Terms and services";
};

type EditableDocumentDraft = {
  description: string;
  eyebrow: string;
  sections: EditableSectionDraft[];
  title: string;
};

type EditableSectionDraft = {
  body: string;
  itemsText: string;
  title: string;
};

export function AdminLegalDocumentEditor({
  colors,
  currentDocument,
  hasOverride,
  onResetToDefault,
  onSaveDocument,
  sectionLabel,
}: AdminLegalDocumentEditorProps) {
  const [draft, setDraft] = useState<EditableDocumentDraft>(() =>
    createDraftFromDocument(currentDocument),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setDraft(createDraftFromDocument(currentDocument));
    setError(null);
  }, [currentDocument]);

  const hasChanges = useMemo(
    () => serializeDraft(draft) !== serializeDraft(createDraftFromDocument(currentDocument)),
    [currentDocument, draft],
  );

  const previewTitle = draft.title.trim() || currentDocument.title;
  const previewDescription =
    draft.description.trim() || currentDocument.description;

  async function handleSave() {
    const normalizedDocument = normalizeDraft(draft);
    const validationError = validateDocument(normalizedDocument);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      await onSaveDocument(normalizedDocument);
      setError(null);
      showAppToast({
        text: `${sectionLabel} customization saved.`,
        tone: "success",
      });
    } catch (error) {
      setError(
        getApiErrorMessage(error, `Couldn't save the ${sectionLabel.toLowerCase()}.`),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSecondaryAction() {
    if (!hasOverride) {
      setDraft(createDraftFromDocument(currentDocument));
      setError(null);
      return;
    }

    try {
      setIsResetting(true);
      await onResetToDefault();
      setError(null);
      showAppToast({
        text: `${sectionLabel} reset to the default copy.`,
        tone: "success",
      });
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          `Couldn't reset the ${sectionLabel.toLowerCase()}.`,
        ),
      );
    } finally {
      setIsResetting(false);
    }
  }

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
        {sectionLabel}
      </Text>
      <Text style={[styles.title, { color: colors.title }]}>
        {sectionLabel} customization
      </Text>
      <Text style={[styles.description, { color: colors.body }]}>
        Edit the live document copy shown in the app. The current legal page is
        loaded here as the starting point for your custom version.
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
          {previewTitle}
        </Text>
        <Text style={[styles.previewBody, { color: colors.body }]}>
          {previewDescription}
        </Text>
        <Text style={[styles.previewHint, { color: colors.body }]}>
          {hasOverride
            ? "A custom version is currently active. Reset to return to the generated default copy for the current app title and contact email."
            : "Saving will create a custom version of this document. Until then, the generated default copy continues to power the app."}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.body }]}>
          Eyebrow
        </Text>
        <TextInput
          onChangeText={(value) => {
            setDraft((currentDraft) => ({
              ...currentDraft,
              eyebrow: value,
            }));
            setError(null);
          }}
          placeholder="Policy"
          placeholderTextColor={colors.body}
          style={[
            styles.input,
            {
              backgroundColor: colors.menuBackground,
              borderColor: colors.cardBorder,
              color: colors.title,
            },
          ]}
          value={draft.eyebrow}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.body }]}>
          Page title
        </Text>
        <TextInput
          onChangeText={(value) => {
            setDraft((currentDraft) => ({
              ...currentDraft,
              title: value,
            }));
            setError(null);
          }}
          placeholder="Privacy policy"
          placeholderTextColor={colors.body}
          style={[
            styles.input,
            {
              backgroundColor: colors.menuBackground,
              borderColor: colors.cardBorder,
              color: colors.title,
            },
          ]}
          value={draft.title}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.fieldLabel, { color: colors.body }]}>
          Description
        </Text>
        <TextInput
          multiline
          onChangeText={(value) => {
            setDraft((currentDraft) => ({
              ...currentDraft,
              description: value,
            }));
            setError(null);
          }}
          placeholder="Last updated: May 31, 2026"
          placeholderTextColor={colors.body}
          style={[
            styles.input,
            styles.multilineInput,
            {
              backgroundColor: colors.menuBackground,
              borderColor: colors.cardBorder,
              color: colors.title,
            },
          ]}
          textAlignVertical="top"
          value={draft.description}
        />
      </View>

      <View style={styles.sectionList}>
        {draft.sections.map((section, index) => (
          <View
            key={`${section.title}-${index}`}
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.menuBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.sectionCardTitle, { color: colors.title }]}>
              {section.title.trim() || `Section ${index + 1}`}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.body }]}>
                Section title
              </Text>
              <TextInput
                onChangeText={(value) => {
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    sections: currentDraft.sections.map((currentSection, sectionIndex) =>
                      sectionIndex === index
                        ? {
                            ...currentSection,
                            title: value,
                          }
                        : currentSection,
                    ),
                  }));
                  setError(null);
                }}
                placeholder={`Section ${index + 1}`}
                placeholderTextColor={colors.body}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.title,
                  },
                ]}
                value={section.title}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.body }]}>
                Body
              </Text>
              <TextInput
                multiline
                onChangeText={(value) => {
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    sections: currentDraft.sections.map((currentSection, sectionIndex) =>
                      sectionIndex === index
                        ? {
                            ...currentSection,
                            body: value,
                          }
                        : currentSection,
                    ),
                  }));
                  setError(null);
                }}
                placeholder="Section body text"
                placeholderTextColor={colors.body}
                style={[
                  styles.input,
                  styles.multilineInput,
                  styles.sectionBodyInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.title,
                  },
                ]}
                textAlignVertical="top"
                value={section.body}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.body }]}>
                Bullet items
              </Text>
              <TextInput
                multiline
                onChangeText={(value) => {
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    sections: currentDraft.sections.map((currentSection, sectionIndex) =>
                      sectionIndex === index
                        ? {
                            ...currentSection,
                            itemsText: value,
                          }
                        : currentSection,
                    ),
                  }));
                  setError(null);
                }}
                placeholder={"One item per line"}
                placeholderTextColor={colors.body}
                style={[
                  styles.input,
                  styles.multilineInput,
                  styles.sectionItemsInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    color: colors.title,
                  },
                ]}
                textAlignVertical="top"
                value={section.itemsText}
              />
            </View>
          </View>
        ))}
      </View>

      {error ? (
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: colors.subtleAccent,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: "#B91C1C" }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!hasChanges || isSaving || isResetting}
          onPress={() => void handleSave()}
          style={({ pressed }) => [
            styles.primaryAction,
            {
              backgroundColor: colors.accent,
            },
            pressed && styles.actionPressed,
            (!hasChanges || isSaving || isResetting) && styles.actionDisabled,
          ]}
        >
          <Text style={styles.primaryActionText}>
            {isSaving ? "Saving..." : "Save document"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving || isResetting || (!hasOverride && !hasChanges)}
          onPress={() => void handleSecondaryAction()}
          style={({ pressed }) => [
            styles.secondaryAction,
            {
              backgroundColor: colors.menuBackground,
              borderColor: colors.cardBorder,
            },
            pressed && styles.actionPressed,
            (isSaving || isResetting || (!hasOverride && !hasChanges)) &&
              styles.actionDisabled,
          ]}
        >
          <Text
            style={[
              styles.secondaryActionText,
              { color: colors.title },
            ]}
          >
            {isResetting
              ? "Resetting..."
              : hasOverride
                ? "Use default copy"
                : "Reset edits"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function createDraftFromDocument(document: SettingsDocument): EditableDocumentDraft {
  return {
    eyebrow: document.eyebrow,
    title: document.title,
    description: document.description,
    sections: document.sections.map((section) => ({
      title: section.title,
      body: section.body ?? "",
      itemsText: section.items?.join("\n") ?? "",
    })),
  };
}

function normalizeDraft(draft: EditableDocumentDraft): SettingsDocument {
  return {
    eyebrow: draft.eyebrow.trim(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    sections: draft.sections.map((section) => {
      const body = section.body.trim();
      const items = section.itemsText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

      return {
        title: section.title.trim(),
        ...(body ? { body } : {}),
        ...(items.length > 0 ? { items } : {}),
      };
    }),
  };
}

function serializeDraft(draft: EditableDocumentDraft) {
  return JSON.stringify(normalizeDraft(draft));
}

function validateDocument(document: SettingsDocument) {
  if (!document.eyebrow) {
    return "Eyebrow is required.";
  }

  if (!document.title) {
    return "Page title is required.";
  }

  if (!document.description) {
    return "Description is required.";
  }

  if (document.sections.length === 0) {
    return "At least one section is required.";
  }

  for (const [index, section] of document.sections.entries()) {
    if (!section.title) {
      return `Section ${index + 1} needs a title.`;
    }
  }

  return null;
}

const styles = StyleSheet.create({
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
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: {
    paddingTop: 12,
  },
  sectionList: {
    gap: 14,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  sectionCardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionBodyInput: {
    minHeight: 120,
  },
  sectionItemsInput: {
    minHeight: 108,
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
