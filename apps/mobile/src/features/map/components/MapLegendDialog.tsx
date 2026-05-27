import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  MAP_LEGEND_SECTIONS,
  type MapLegendSwatchConfig,
} from "@/src/features/map/mapLegend";

type MapLegendDialogProps = {
  visible: boolean;
  isDark: boolean;
  onClose: () => void;
};

export function MapLegendDialog({
  visible,
  isDark,
  onClose,
}: MapLegendDialogProps) {
  const colors = isDark
    ? {
        backdrop: "rgba(2, 6, 23, 0.72)",
        cardBackground: "#0F172A",
        cardBorder: "#1E293B",
        title: "#F8FAFC",
        subtitle: "#CBD5E1",
        sectionTitle: "#5EEAD4",
        itemTitle: "#E2E8F0",
        itemDetail: "#94A3B8",
        closeBackground: "#111827",
        closeIcon: "#E2E8F0",
        swatchBorder: "#334155",
      }
    : {
        backdrop: "rgba(15, 23, 42, 0.28)",
        cardBackground: "#FFFFFF",
        cardBorder: "#E2E8F0",
        title: "#0F172A",
        subtitle: "#475569",
        sectionTitle: "#0F766E",
        itemTitle: "#0F172A",
        itemDetail: "#64748B",
        closeBackground: "#F8FAFC",
        closeIcon: "#334155",
        swatchBorder: "#CBD5E1",
      };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.legendModalRoot}>
        <Pressable
          accessibilityLabel="Close map legend"
          accessibilityRole="button"
          onPress={onClose}
          style={[
            styles.legendModalBackdrop,
            { backgroundColor: colors.backdrop },
          ]}
        />

        <View style={styles.legendModalCenter}>
          <View
            style={[
              styles.legendCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.legendHeader}>
              <View style={styles.legendHeaderCopy}>
                <Text style={[styles.legendTitle, { color: colors.title }]}>
                  Map legend
                </Text>
                <Text style={[styles.legendSubtitle, { color: colors.subtitle }]}>
                  Symbols and colors used across the map and overlays.
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Close map legend"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.legendCloseButton,
                  {
                    backgroundColor: colors.closeBackground,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons
                  color={colors.closeIcon}
                  name="close-outline"
                  size={22}
                />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.legendContent}
              showsVerticalScrollIndicator={false}
            >
              {MAP_LEGEND_SECTIONS.map((section) => (
                <View key={section.title} style={styles.legendSection}>
                  <Text
                    style={[
                      styles.legendSectionTitle,
                      { color: colors.sectionTitle },
                    ]}
                  >
                    {section.title}
                  </Text>

                  <View style={styles.legendItemList}>
                    {section.items.map((item) => (
                      <View key={item.label} style={styles.legendItemRow}>
                        <MapLegendSwatch
                          isDark={isDark}
                          borderColor={colors.swatchBorder}
                          swatch={item.swatch}
                        />
                        <View style={styles.legendItemCopy}>
                          <Text
                            style={[
                              styles.legendItemTitle,
                              { color: colors.itemTitle },
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              styles.legendItemDetail,
                              { color: colors.itemDetail },
                            ]}
                          >
                            {item.detail}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MapLegendSwatch({
  swatch,
  borderColor,
  isDark,
}: {
  swatch: MapLegendSwatchConfig;
  borderColor: string;
  isDark: boolean;
}) {
  if (swatch.kind === "line") {
    return (
      <View style={styles.legendSwatchFrame}>
        {swatch.casingColor ? (
          <View
            style={[
              styles.legendSwatchLineCasing,
              { backgroundColor: swatch.casingColor },
            ]}
          />
        ) : null}
        <View
          style={[
            styles.legendSwatchLine,
            { backgroundColor: swatch.color },
            swatch.casingColor ? styles.legendSwatchLineInset : null,
          ]}
        />
      </View>
    );
  }

  if (swatch.kind === "ring") {
    return (
      <View style={styles.legendSwatchFrame}>
        <View
          style={[
            styles.legendSwatchRing,
            {
              backgroundColor: swatch.color,
              borderColor: swatch.borderColor ?? borderColor,
            },
          ]}
        />
      </View>
    );
  }

  if (swatch.kind === "marker") {
    return (
      <View style={styles.legendSwatchFrame}>
        <View
          style={[
            styles.legendSwatchMarker,
            {
              backgroundColor: swatch.color,
              borderColor: swatch.borderColor,
              borderRadius: swatch.shape === "circle" ? 999 : 4,
              transform:
                swatch.shape === "diamond" ? [{ rotate: "45deg" }] : undefined,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.legendSwatchFrame}>
      <View
        style={[
          styles.legendSwatchFill,
          {
            backgroundColor: swatch.color,
            borderColor: swatch.borderColor ?? borderColor,
            opacity: isDark ? 0.96 : 1,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  legendModalRoot: {
    flex: 1,
  },
  legendModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  legendModalCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  legendCard: {
    maxHeight: "82%",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 12,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  legendHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  legendTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  legendSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  legendCloseButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  legendContent: {
    gap: 16,
    paddingBottom: 6,
  },
  legendSection: {
    gap: 10,
  },
  legendSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  legendItemList: {
    gap: 10,
  },
  legendItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  legendItemCopy: {
    flex: 1,
    gap: 3,
  },
  legendItemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  legendItemDetail: {
    fontSize: 12,
    lineHeight: 17,
  },
  legendSwatchFrame: {
    width: 28,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  legendSwatchFill: {
    width: 24,
    height: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendSwatchLineCasing: {
    position: "absolute",
    width: 24,
    height: 8,
    borderRadius: 999,
  },
  legendSwatchLine: {
    width: 24,
    height: 4,
    borderRadius: 999,
  },
  legendSwatchLineInset: {
    position: "absolute",
    width: 24,
  },
  legendSwatchRing: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 3,
  },
  legendSwatchMarker: {
    width: 16,
    height: 16,
    borderWidth: 2,
  },
});
