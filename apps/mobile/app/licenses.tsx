import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function LicensesRoute() {
  return (
    <SettingsDocumentScreen
      eyebrow="Info"
      title="Licenses"
      description="This placeholder page is ready for a fuller third-party notices view before release."
      sections={[
        {
          title: "Core stack",
          body: "This mobile app is built with Expo, React Native, Expo Router, Zustand, and MapLibre React Native, alongside other open-source packages listed in the project manifest.",
        },
        {
          title: "Before release",
          body: "A full third-party notices list can be added here once launch packaging is finalized and the exact dependency set is locked.",
        },
      ]}
    />
  );
}
