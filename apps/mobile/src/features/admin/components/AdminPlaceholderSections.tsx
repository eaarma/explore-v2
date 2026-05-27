import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AdminColors } from "@/src/features/admin/utils/adminScreenTheme";

type PlaceholderSectionProps = {
  colors: AdminColors;
  eyebrow: string;
  title: string;
  description: string;
  placeholderItems: string[];
};

function PlaceholderSection({
  colors,
  eyebrow,
  title,
  description,
  placeholderItems,
}: PlaceholderSectionProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text>
      <Text style={[styles.title, { color: colors.title }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.body }]}>
        {description}
      </Text>

      <View style={styles.placeholderList}>
        {placeholderItems.map((item) => (
          <View
            key={item}
            style={[
              styles.placeholderRow,
              {
                backgroundColor: colors.subtleAccent,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.placeholderDot,
                {
                  backgroundColor: colors.accent,
                },
              ]}
            />
            <Text style={[styles.placeholderText, { color: colors.title }]}>
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export type AdminSectionProps = {
  colors: AdminColors;
};

export function LocationsAdminSection({ colors }: AdminSectionProps) {
  return (
    <PlaceholderSection
      colors={colors}
      eyebrow="Locations"
      title="Location management"
      description="Placeholder area for adding, editing, reviewing, and publishing location content."
      placeholderItems={[
        "Create location form placeholder",
        "Edit existing location placeholder",
        "Location image management placeholder",
      ]}
    />
  );
}

export function JourneysAdminSection({ colors }: AdminSectionProps) {
  return (
    <PlaceholderSection
      colors={colors}
      eyebrow="Journeys"
      title="Journey management"
      description="Placeholder area for assembling journeys, updating metadata, and managing route content."
      placeholderItems={[
        "Create journey form placeholder",
        "Edit journey details placeholder",
        "Journey composition tools placeholder",
      ]}
    />
  );
}

export function UsersAdminSection({ colors }: AdminSectionProps) {
  return (
    <PlaceholderSection
      colors={colors}
      eyebrow="Users"
      title="User management"
      description="Placeholder area for reviewing users, roles, and moderation-related account actions."
      placeholderItems={[
        "User list placeholder",
        "Role management placeholder",
        "Moderation actions placeholder",
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  placeholderList: {
    marginTop: 8,
    gap: 10,
  },
  placeholderRow: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  placeholderDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  placeholderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
});
