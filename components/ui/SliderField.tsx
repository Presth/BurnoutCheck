import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontSize, Radius, Spacing } from '@/constants/theme';

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  displayValue?: string;
}

export function SliderField({
  label,
  value,
  onChange,
  minimumValue,
  maximumValue,
  step = 1,
  displayValue,
}: SliderFieldProps) {
  const colors = useThemeColors();
  const shown = displayValue ?? String(value);
  const progress =
    maximumValue === minimumValue
      ? 0
      : (value - minimumValue) / (maximumValue - minimumValue);

  const decrement = () => onChange(Math.max(minimumValue, value - step));
  const increment = () => onChange(Math.min(maximumValue, value + step));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.primary }]}>{shown}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          onPress={decrement}
          disabled={value <= minimumValue}
          style={[styles.btn, { borderColor: colors.border, opacity: value <= minimumValue ? 0.4 : 1 }]}
        >
          <FontAwesome name="minus" size={14} color={colors.primary} />
        </TouchableOpacity>
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
        <TouchableOpacity
          onPress={increment}
          disabled={value >= maximumValue}
          style={[styles.btn, { borderColor: colors.border, opacity: value >= maximumValue ? 0.4 : 1 }]}
        >
          <FontAwesome name="plus" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: '500',
  },
  value: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
