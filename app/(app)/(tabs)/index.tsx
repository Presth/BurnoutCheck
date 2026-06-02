import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { BurnoutBadge } from '@/components/ui/BurnoutBadge';
import { BurnoutTrendChart } from '@/components/charts/BurnoutTrendChart';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAssessments, getLatestAssessment } from '@/services/firestore';
import { getDailyQuote } from '@/constants/quotes';
import type { Assessment } from '@/types';
import { FontSize, Radius, Spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latest, setLatest] = useState<Assessment | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [streak, setStreak] = useState(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [latestAssessment, all] = await Promise.all([
        getLatestAssessment(user.uid),
        getAssessments(user.uid, 7),
      ]);
      setLatest(latestAssessment);
      setAssessments(all);

      const uniqueDays = new Set(
        all.map((a) => new Date(a.createdAt).toDateString())
      );
      setStreak(uniqueDays.size);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const firstName = user?.name?.split(' ')[0] ?? 'Student';
  const greeting = getGreeting();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{firstName} 🌿</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: colors.accent + '50' }]}>
            <FontAwesome name="fire" size={14} color={colors.primary} />
            <Text style={[styles.streakText, { color: colors.primary }]}>{streak}d</Text>
          </View>
        </View>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <Card style={styles.statusCard}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Current Status</Text>
              {latest ? (
                <>
                  <View style={styles.statusRow}>
                    <BurnoutBadge level={latest.burnoutLevel} size="lg" />
                    <Text style={[styles.score, { color: colors.text }]}>{latest.burnoutScore}</Text>
                  </View>
                  <Text style={[styles.statusHint, { color: colors.textSecondary }]} numberOfLines={2}>
                    {latest.explanation}
                  </Text>
                </>
              ) : (
                <Text style={[styles.statusHint, { color: colors.textSecondary }]}>
                  No assessment yet. Log your day to get your first burnout check.
                </Text>
              )}
            </Card>

            <View style={styles.summaryRow}>
              <SummaryCard
                icon="book"
                label="Latest Score"
                value={latest ? String(latest.burnoutScore) : '—'}
                colors={colors}
              />
              <SummaryCard
                icon="calendar"
                label="Check-ins"
                value={String(assessments.length)}
                colors={colors}
              />
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>7-Day Trend</Text>
            <Card padded={false} style={styles.chartCard}>
              <BurnoutTrendChart assessments={assessments} />
            </Card>

            <TouchableOpacity
              style={[styles.fab, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(app)/log')}
              activeOpacity={0.9}
            >
              <FontAwesome name="plus" size={20} color="#fff" />
              <Text style={styles.fabText}>Log Today</Text>
            </TouchableOpacity>

            <Card style={styles.tipCard}>
              <FontAwesome name="lightbulb-o" size={20} color={colors.primary} />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { color: colors.text }]}>Wellness Tip</Text>
                <Text style={[styles.tipBody, { color: colors.textSecondary }]}>
                  {getDailyQuote()}
                </Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function SummaryCard({
  icon,
  label,
  value,
  colors,
}: {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Card style={{ flex: 1 }}>
      <FontAwesome name={icon} size={18} color={colors.primary} />
      <Text style={[summaryStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[summaryStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
}

const summaryStyles = StyleSheet.create({
  value: { fontSize: FontSize.xl, fontWeight: '700', marginTop: Spacing.sm },
  label: { fontSize: FontSize.xs, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.sm },
  name: { fontSize: FontSize.xxl, fontWeight: '700', marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  streakText: { fontSize: FontSize.sm, fontWeight: '600' },
  statusCard: { marginBottom: Spacing.md },
  sectionLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  score: { fontSize: FontSize.hero, fontWeight: '700' },
  statusHint: { fontSize: FontSize.sm, lineHeight: 20 },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', marginBottom: Spacing.sm },
  chartCard: { marginBottom: Spacing.lg, overflow: 'hidden', padding: Spacing.sm },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  fabText: { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
  tipCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: 4 },
  tipBody: { fontSize: FontSize.sm, lineHeight: 20 },
});
