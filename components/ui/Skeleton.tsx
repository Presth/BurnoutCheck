import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Radius, Spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, style }: SkeletonProps) {
  const colors = useThemeColors();
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.dashboard}>
      <Skeleton height={28} width="60%" />
      <Skeleton height={120} style={{ marginTop: Spacing.lg }} />
      <View style={styles.row}>
        <Skeleton height={80} width="48%" />
        <Skeleton height={80} width="48%" />
      </View>
      <Skeleton height={160} style={{ marginTop: Spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
  },
  dashboard: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
});
