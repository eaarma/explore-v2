import { useResolvedAppConfiguration } from "@/src/features/appConfig/useResolvedAppConfiguration";
import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function PrivacyPolicyRoute() {
  const { privacyPolicyDocument } = useResolvedAppConfiguration();

  return <SettingsDocumentScreen {...privacyPolicyDocument} />;
}
