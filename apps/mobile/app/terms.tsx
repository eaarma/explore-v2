import { useResolvedAppConfiguration } from "@/src/features/appConfig/useResolvedAppConfiguration";
import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function TermsRoute() {
  const { termsDocument } = useResolvedAppConfiguration();

  return <SettingsDocumentScreen {...termsDocument} />;
}
