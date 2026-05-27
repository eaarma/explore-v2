import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function PrivacyPolicyRoute() {
  return (
    <SettingsDocumentScreen
      eyebrow="Placeholder"
      title="Privacy policy"
      description="This MVP route is ready for final legal copy. For now it explains what will eventually live here."
      sections={[
        {
          title: "What this page will cover",
          body: "The final privacy policy will describe account data, location usage, offline discovery syncing, and how map content is cached on device.",
        },
        {
          title: "Current MVP behavior",
          body: "This app stores your authenticated session on device, caches map and content data for offline browsing, and uses location services for nearby browsing and discovery checks when you grant permission.",
        },
      ]}
    />
  );
}
