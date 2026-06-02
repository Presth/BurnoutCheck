import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { BurnoutLevel } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontSize, Spacing } from '@/constants/theme';

interface BurnoutMeterProps {
  score: number;
  level: BurnoutLevel;
}

export function BurnoutMeter({ score, level }: BurnoutMeterProps) {
  const colors = useThemeColors();
  const anim = useRef(new Animated.Value(0)).current;
  const fillColor =
    level === 'Low' ? colors.low : level === 'Moderate' ? colors.moderate : colors.high;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: score / 100,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [score, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={[styles.score, { color: colors.text }]}>{score}</Text>
        <Text style={[styles.max, { color: colors.textMuted }]}>/ 100</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fill, { width, backgroundColor: fillColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  score: {
    fontSize: 36,
    fontWeight: '700',
  },
  max: {
    fontSize: FontSize.md,
    marginLeft: 4,
  },
  track: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
