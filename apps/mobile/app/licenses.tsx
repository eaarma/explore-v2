import { useResolvedAppConfiguration } from "@/src/features/appConfig/useResolvedAppConfiguration";
import { SettingsDocumentScreen } from "@/src/features/settings/screens/SettingsDocumentScreen";

export default function LicensesRoute() {
  const { appTitle } = useResolvedAppConfiguration();

  return (
    <SettingsDocumentScreen
      eyebrow="Notices"
      title="Attributions & Licenses"
      description={`${appTitle} uses open-source software and mapping services.`}
      sections={[
        {
          title: "Major technologies",
          items: [
            "React Native",
            "Expo",
            "MapLibre",
            "OpenStreetMap",
            "MapTiler",
            "Firebase",
          ],
        },
        {
          title: "Map data",
          body: "© OpenStreetMap contributors",
        },
        {
          title: "Map tiles",
          body: "© MapTiler",
        },
        {
          title: "Open-source software",
          body: "This application uses various open-source libraries licensed under MIT, Apache 2.0, and other compatible licenses.",
        },
        {
          title: "Additional license information",
          body: "Additional license information is available from the respective projects.",
        },
      ]}
    />
  );
}
