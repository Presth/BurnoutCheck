import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { BurnoutBadge } from '@/components/ui/BurnoutBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAssessments } from '@/services/firestore';
import type { Assessment } from '@/types';
import { FontSize, Radius, Spacing } from '@/constants/theme';

export default function HistoryScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getAssessments(user.uid);
      setAssessments(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = useMemo(() => {
    if (!filterDate.trim()) return assessments;
    return assessments.filter((a) =>
      new Date(a.createdAt).toLocaleDateString().includes(filterDate.trim())
    );
  }, [assessments, filterDate]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>History</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Track your progress over time
        </Text>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <FontAwesome name="search" size={14} color={colors.textMuted} />
        <TextInput
          placeholder="Filter by date (e.g. 18/05)"
          placeholderTextColor={colors.textMuted}
          value={filterDate}
          onChangeText={setFilterDate}
          style={[styles.search, { color: colors.text }]}
        />
        {filterDate.length > 0 && (
          <TouchableOpacity onPress={() => setFilterDate('')}>
            <FontAwesome name="times-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <DashboardSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            message="Complete your first daily check-in to start building your wellness history."
          />
        ) : (
          filtered.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setExpandedId(expanded ? null : item.id!)}
              >
                <Card style={styles.item}>
                  <View style={styles.itemHeader}>
                    <View>
                      <Text style={[styles.date, { color: colors.text }]}>
                        {formatDate(item.createdAt)}
                      </Text>
                      <BurnoutBadge level={item.burnoutLevel} />
                    </View>
                    <View style={styles.scoreWrap}>
                      <Text style={[styles.score, { color: colors.primary }]}>{item.burnoutScore}</Text>
                      <FontAwesome
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={colors.textMuted}
                      />
                    </View>
                  </View>
                  {expanded && (
                    <View style={styles.expanded}>
                      <Text style={[styles.expLabel, { color: colors.textMuted }]}>Why</Text>
                      <Text style={[styles.expText, { color: colors.textSecondary }]}>
                        {item.explanation}
                      </Text>
                      <Text style={[styles.expLabel, { color: colors.textMuted, marginTop: Spacing.sm }]}>
                        Recommendations
                      </Text>
                      <Text style={[styles.expText, { color: colors.textSecondary }]}>
                        {item.recommendation}
                      </Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: FontSize.sm, marginTop: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  search: { flex: 1, fontSize: FontSize.sm, paddingVertical: Spacing.xs },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  item: { marginBottom: Spacing.md },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.xs },
  scoreWrap: { alignItems: 'flex-end', gap: 4 },
  score: { fontSize: FontSize.xxl, fontWeight: '700' },
  expanded: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#E8F0EC' },
  expLabel: { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  expText: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 4 },
});
