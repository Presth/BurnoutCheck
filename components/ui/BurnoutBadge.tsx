import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { BurnoutLevel } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontSize, Radius, Spacing } from '@/constants/theme';

interface BurnoutBadgeProps {
  level: BurnoutLevel;
  size?: 'sm' | 'lg';
}

export function BurnoutBadge({ level, size = 'sm' }: BurnoutBadgeProps) {
  const colors = useThemeColors();
  const bg =
    level === 'Low' ? colors.low : level === 'Moderate' ? colors.moderate : colors.high;

  return (
    <View style={[styles.badge, { backgroundColor: bg + '25', borderColor: bg }, size === 'lg' && styles.lg]}>
      <View style={[styles.dot, { backgroundColor: bg }]} />
      <Text style={[styles.text, { color: bg }, size === 'lg' && styles.lgText]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  lg: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  lgText: {
    fontSize: FontSize.lg,
  },
});
