import { useMemo } from "react";

import { useAppConfigurationStore } from "@/src/features/appConfig/appConfigStore";
import {
  buildPrivacyPolicyDocument,
  buildTermsDocument,
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
} from "@/src/features/settings/content/legalDocuments";
import {
  DEFAULT_APP_TITLE,
  DEFAULT_CONTACT_EMAIL,
  resolveAppTitle,
  resolveContactEmail,
} from "@/src/shared/branding/appBranding";

export function useResolvedAppConfiguration() {
  const configuration = useAppConfigurationStore((state) => state.configuration);
  const isHydrated = useAppConfigurationStore((state) => state.isHydrated);
  const isLoading = useAppConfigurationStore((state) => state.isLoading);
  const hydrate = useAppConfigurationStore((state) => state.hydrate);
  const refresh = useAppConfigurationStore((state) => state.refresh);

  return useMemo(() => {
    const appTitle = resolveAppTitle(configuration?.appTitle ?? DEFAULT_APP_TITLE);
    const contactEmail = resolveContactEmail(
      configuration?.contactEmail ?? DEFAULT_CONTACT_EMAIL,
    );

    return {
      configuration,
      appTitle,
      contactEmail,
      privacyPolicyVersion:
        configuration?.privacyPolicyVersion ?? PRIVACY_POLICY_VERSION,
      termsVersion: configuration?.termsVersion ?? TERMS_VERSION,
      privacyPolicyDocument:
        configuration?.privacyPolicyDocument ??
        buildPrivacyPolicyDocument({
          appTitle,
          contactEmail,
        }),
      termsDocument:
        configuration?.termsDocument ??
        buildTermsDocument({
          appTitle,
          contactEmail,
        }),
      isHydrated,
      isLoading,
      hydrate,
      refresh,
    };
  }, [configuration, hydrate, isHydrated, isLoading, refresh]);
}
