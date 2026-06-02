import { useLegalDocuments } from "@/src/features/settings/content/legalDocuments";
import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function PrivacyPolicyRoute() {
  const { privacyPolicyDocument } = useLegalDocuments();

  return <SettingsDocumentScreen {...privacyPolicyDocument} />;
}
