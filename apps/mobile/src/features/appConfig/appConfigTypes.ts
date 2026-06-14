import type { SettingsDocument } from "@/src/features/settings/components/SettingsDocumentContent";

export type AppConfiguration = {
  appTitle: string;
  contactEmail: string;
  privacyPolicyVersion: string;
  termsVersion: string;
  privacyPolicyDocument: SettingsDocument | null;
  termsDocument: SettingsDocument | null;
  updatedByUserId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UpdateAppConfigurationRequest = {
  appTitle: string;
  contactEmail: string;
  privacyPolicyVersion: string;
  termsVersion: string;
  privacyPolicyDocument: SettingsDocument;
  termsDocument: SettingsDocument;
};
