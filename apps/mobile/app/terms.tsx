import { useLegalDocuments } from "@/src/features/settings/content/legalDocuments";
import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function TermsRoute() {
  const { termsDocument } = useLegalDocuments();

  return <SettingsDocumentScreen {...termsDocument} />;
}
