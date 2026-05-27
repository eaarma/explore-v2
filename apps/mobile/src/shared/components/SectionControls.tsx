import type { ReactNode, RefObject } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type ControlStyles = {
  chipRow: StyleProp<ViewStyle>;
  controlBlock: StyleProp<ViewStyle>;
  controlLabel: StyleProp<TextStyle>;
  filterChip: StyleProp<ViewStyle>;
  filterChipActive: StyleProp<ViewStyle>;
  filterChipText: StyleProp<TextStyle>;
  filterChipTextActive: StyleProp<TextStyle>;
  searchInput: StyleProp<TextStyle>;
  searchInputClearButton: StyleProp<ViewStyle>;
  searchInputClearButtonText: StyleProp<TextStyle>;
  searchInputWrapper: StyleProp<ViewStyle>;
  segmentButton: StyleProp<ViewStyle>;
  segmentButtonActive: StyleProp<ViewStyle>;
  segmentButtonText: StyleProp<TextStyle>;
  segmentButtonTextActive: StyleProp<TextStyle>;
  segmentedRow: StyleProp<ViewStyle>;
};

type ControlOption<T extends string> = {
  key: T;
  label: string;
};

type SectionSearchFieldProps = {
  inputRef: RefObject<TextInput | null>;
  onChangeText: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  placeholderTextColor: string;
  styles: ControlStyles;
  value: string;
};

type SectionSegmentedControlProps<T extends string> = {
  activeKey: T;
  label: string;
  onSelect: (key: T) => void;
  options: readonly ControlOption<T>[];
  styles: ControlStyles;
};

type SectionChipSelectorProps<T extends string> = {
  activeKey: T;
  label: string;
  onSelect: (key: T) => void;
  options: readonly ControlOption<T>[];
  styles: ControlStyles;
};

type SectionCategorySelectorProps<T extends string> = {
  allLabel?: string;
  label: string;
  onClear: () => void;
  onToggle: (key: T) => void;
  options: readonly ControlOption<T>[];
  selectedKeys: readonly T[];
  styles: ControlStyles;
};

export function SectionSearchField({
  inputRef,
  onChangeText,
  onClear,
  placeholder,
  placeholderTextColor,
  styles,
  value,
}: SectionSearchFieldProps) {
  return (
    <View style={styles.searchInputWrapper}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 ? (
        <Pressable
          onPress={onClear}
          style={styles.searchInputClearButton}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
        >
          <Text style={styles.searchInputClearButtonText}>X</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function SectionSegmentedControl<T extends string>({
  activeKey,
  label,
  onSelect,
  options,
  styles,
}: SectionSegmentedControlProps<T>) {
  return (
    <ControlBlock label={label} styles={styles}>
      <View style={styles.segmentedRow}>
        {options.map((option) => {
          const isActive = activeKey === option.key;

          return (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option.key)}
              style={[
                styles.segmentButton,
                isActive && styles.segmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  isActive && styles.segmentButtonTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ControlBlock>
  );
}

export function SectionChipSelector<T extends string>({
  activeKey,
  label,
  onSelect,
  options,
  styles,
}: SectionChipSelectorProps<T>) {
  return (
    <ControlBlock label={label} styles={styles}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {options.map((option) => {
          const isActive = activeKey === option.key;

          return (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ControlBlock>
  );
}

export function SectionCategorySelector<T extends string>({
  allLabel = "All",
  label,
  onClear,
  onToggle,
  options,
  selectedKeys,
  styles,
}: SectionCategorySelectorProps<T>) {
  return (
    <ControlBlock label={label} styles={styles}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <Pressable
          onPress={onClear}
          style={[
            styles.filterChip,
            selectedKeys.length === 0 && styles.filterChipActive,
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedKeys.length === 0 && styles.filterChipTextActive,
            ]}
          >
            {allLabel}
          </Text>
        </Pressable>

        {options.map((option) => {
          const isActive = selectedKeys.includes(option.key);

          return (
            <Pressable
              key={option.key}
              onPress={() => onToggle(option.key)}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </ControlBlock>
  );
}

function ControlBlock({
  children,
  label,
  styles,
}: {
  children: ReactNode;
  label: string;
  styles: ControlStyles;
}) {
  return (
    <View style={styles.controlBlock}>
      <Text style={styles.controlLabel}>{label}</Text>
      {children}
    </View>
  );
}
