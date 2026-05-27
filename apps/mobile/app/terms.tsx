import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function TermsRoute() {
  return (
    <SettingsDocumentScreen
      eyebrow="Placeholder"
      title="Terms"
      description="This MVP route is ready for the final terms of use copy."
      sections={[
        {
          title: "What this page will cover",
          body: "The finished version will define acceptable use, account responsibilities, map-data limitations, and service availability expectations.",
        },
        {
          title: "Current MVP behavior",
          body: "Explore is currently intended for testing the mobile experience, offline map behavior, and discovery flows while the full legal review and launch copy are still in progress.",
        },
      ]}
    />
  );
}
