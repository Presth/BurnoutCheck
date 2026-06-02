import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BurnoutBadge } from '@/components/ui/BurnoutBadge';
import { BurnoutMeter } from '@/components/BurnoutMeter';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { BurnoutLevel } from '@/types';
import { FontSize, Spacing } from '@/constants/theme';

export default function AssessmentResultScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{
    level: string;
    score: string;
    explanation: string;
    recommendation: string;
  }>();

  const level = (params.level as BurnoutLevel) || 'Moderate';
  const score = Number(params.score) || 0;
  const explanation = params.explanation || '';
  const recommendation = params.recommendation || '';

  const encouragement =
    level === 'Low'
      ? "You're maintaining good balance. Keep it up!"
      : level === 'Moderate'
        ? 'A few small changes can make a big difference this week.'
        : 'Your wellbeing matters. Take things one step at a time today.';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <FontAwesome
            name={level === 'Low' ? 'smile-o' : level === 'Moderate' ? 'meh-o' : 'frown-o'}
            size={48}
            color={level === 'Low' ? colors.low : level === 'Moderate' ? colors.moderate : colors.high}
          />
          <Text style={[styles.heroTitle, { color: colors.text }]}>Assessment Complete</Text>
          <Text style={[styles.encouragement, { color: colors.textSecondary }]}>{encouragement}</Text>
        </View>

        <Card style={styles.resultCard}>
          <BurnoutBadge level={level} size="lg" />
          <BurnoutMeter score={score} level={level} />
          <Text style={[styles.explanation, { color: colors.textSecondary }]}>{explanation}</Text>
        </Card>

        <Card style={styles.recCard}>
          <View style={styles.recHeader}>
            <FontAwesome name="magic" size={18} color={colors.primary} />
            <Text style={[styles.recTitle, { color: colors.text }]}>AI Wellness Tips</Text>
          </View>
          <Text style={[styles.recBody, { color: colors.textSecondary }]}>{recommendation}</Text>
        </Card>

        <Button title="Back to Home" onPress={() => router.replace('/(app)/(tabs)')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  hero: { alignItems: 'center', marginBottom: Spacing.lg },
  heroTitle: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.md },
  encouragement: { fontSize: FontSize.md, textAlign: 'center', marginTop: Spacing.sm },
  resultCard: { marginBottom: Spacing.md, gap: Spacing.md },
  explanation: { fontSize: FontSize.sm, lineHeight: 22 },
  recCard: { marginBottom: Spacing.lg },
  recHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  recTitle: { fontSize: FontSize.md, fontWeight: '600' },
  recBody: { fontSize: FontSize.sm, lineHeight: 22 },
});
