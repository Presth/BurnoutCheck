import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import type { Assessment } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontSize, Radius, Spacing } from '@/constants/theme';

interface BurnoutTrendChartProps {
  assessments: Assessment[];
}

export function BurnoutTrendChart({ assessments }: BurnoutTrendChartProps) {
  const colors = useThemeColors();
  const width = Dimensions.get('window').width - Spacing.md * 4;

  const sorted = [...assessments]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-7);

  if (sorted.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ color: colors.textMuted, fontSize: FontSize.sm }}>
          Log daily activities to see your 7-day trend
        </Text>
      </View>
    );
  }

  const labels = sorted.map((a) => {
    const d = new Date(a.createdAt);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  const data = sorted.map((a) => a.burnoutScore);

  return (
    <LineChart
      data={{
        labels,
        datasets: [{ data: data.length === 1 ? [data[0], data[0]] : data }],
      }}
      width={width}
      height={180}
      chartConfig={{
        backgroundColor: colors.surface,
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(45, 106, 79, ${opacity})`,
        labelColor: () => colors.textMuted,
        propsForDots: { r: '5', strokeWidth: 2, stroke: colors.primaryLight },
        propsForBackgroundLines: { stroke: colors.border },
      }}
      bezier
      style={styles.chart}
      withInnerLines={false}
      fromZero
      yAxisSuffix=""
      yLabelsOffset={8}
    />
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: Radius.lg,
    marginLeft: -Spacing.sm,
  },
  empty: {
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
});
