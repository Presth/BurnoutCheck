import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SliderField } from '@/components/ui/SliderField';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { useThemeColors } from '@/hooks/useThemeColors';
import { assessBurnout } from '@/lib/burnoutClassifier';
import { createLogEntry, createAssessment } from '@/services/firestore';
import { generateRecommendations } from '@/services/openai';
import {
  MOOD_LABELS,
  SLEEP_QUALITY_LABELS,
  WORKLOAD_LABELS,
  ACTIVITY_LABELS,
  type DailyLogForm,
} from '@/types';
import { saveLogDraft, loadLogDraft, clearLogDraft } from '@/lib/logDraft';
import { FontSize, Spacing } from '@/constants/theme';

const STEPS = ['Study & Sleep', 'Wellbeing', 'Activity'];

const DEFAULT_FORM: DailyLogForm = {
  studyHours: 6,
  sleepHours: 7,
  sleepQuality: 3,
  stressLevel: 5,
  mood: 3,
  workload: 3,
  physicalActivity: 2,
};

export default function DailyLogScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DailyLogForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLogDraft().then((draft) => {
      if (draft) setForm(draft);
    });
  }, []);

  useEffect(() => {
    saveLogDraft(form);
  }, [form]);

  const update = <K extends keyof DailyLogForm>(key: K, value: DailyLogForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (form.studyHours < 0 || form.studyHours > 16) {
      Alert.alert('Check your entry', 'Study hours should be between 0 and 16.');
      return;
    }

    setSubmitting(true);
    try {
      const result = assessBurnout(form);
      const logId = await createLogEntry({
        userId: user.uid,
        ...form,
        createdAt: new Date().toISOString(),
      });

      const recommendation = await generateRecommendations(
        form,
        result.burnoutLevel,
        result.burnoutScore,
        result.explanation
      );

      const assessmentId = await createAssessment({
        userId: user.uid,
        burnoutLevel: result.burnoutLevel,
        burnoutScore: result.burnoutScore,
        explanation: result.explanation,
        recommendation,
        linkedLogId: logId,
        createdAt: new Date().toISOString(),
      });

      await clearLogDraft();
      router.replace({
        pathname: '/(app)/assessment',
        params: {
          id: assessmentId,
          level: result.burnoutLevel,
          score: String(result.burnoutScore),
          explanation: result.explanation,
          recommendation,
        },
      });
    } catch {
      Alert.alert(
        'Something went wrong',
        'We could not save your log. Check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Daily Check-in</Text>
        <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i <= step ? colors.primary : colors.border,
                flex: 1,
              },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.stepTitle, { color: colors.text }]}>{STEPS[step]}</Text>

          <Card>
            {step === 0 && (
              <>
                <SliderField
                  label="Study hours"
                  value={form.studyHours}
                  onChange={(v) => update('studyHours', v)}
                  minimumValue={0}
                  maximumValue={16}
                  displayValue={`${form.studyHours}h`}
                />
                <SliderField
                  label="Sleep duration"
                  value={form.sleepHours}
                  onChange={(v) => update('sleepHours', v)}
                  minimumValue={3}
                  maximumValue={12}
                  displayValue={`${form.sleepHours}h`}
                />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Sleep quality</Text>
                <SegmentControl
                  options={SLEEP_QUALITY_LABELS}
                  selectedIndex={form.sleepQuality - 1}
                  onSelect={(i) => update('sleepQuality', i + 1)}
                />
              </>
            )}

            {step === 1 && (
              <>
                <SliderField
                  label="Stress level"
                  value={form.stressLevel}
                  onChange={(v) => update('stressLevel', v)}
                  minimumValue={1}
                  maximumValue={10}
                  displayValue={`${form.stressLevel}/10`}
                />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Mood</Text>
                <SegmentControl
                  options={[...MOOD_LABELS]}
                  selectedIndex={form.mood - 1}
                  onSelect={(i) => update('mood', i + 1)}
                />
                <Text style={[styles.fieldLabel, { color: colors.text, marginTop: Spacing.md }]}>
                  Assignment workload
                </Text>
                <SegmentControl
                  options={WORKLOAD_LABELS}
                  selectedIndex={form.workload - 1}
                  onSelect={(i) => update('workload', i + 1)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Physical activity</Text>
                <SegmentControl
                  options={ACTIVITY_LABELS}
                  selectedIndex={form.physicalActivity - 1}
                  onSelect={(i) => update('physicalActivity', i + 1)}
                />
                <Text style={[styles.summary, { color: colors.textSecondary }]}>
                  Takes under a minute. Your answers help estimate burnout risk using a simple
                  decision-tree model.
                </Text>
              </>
            )}
          </Card>

          <View style={styles.actions}>
            {step > 0 ? (
              <Button title="Back" variant="outline" onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {step < STEPS.length - 1 ? (
              <Button title="Next" onPress={() => setStep((s) => s + 1)} style={{ flex: 1 }} />
            ) : (
              <Button
                title="Get Assessment"
                onPress={handleSubmit}
                loading={submitting}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSize.lg, fontWeight: '600' },
  stepLabel: { fontSize: FontSize.sm },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressDot: { height: 4, borderRadius: 2 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  stepTitle: { fontSize: FontSize.xl, fontWeight: '600', marginBottom: Spacing.md },
  fieldLabel: { fontSize: FontSize.md, fontWeight: '500', marginBottom: Spacing.sm },
  summary: { fontSize: FontSize.sm, lineHeight: 20, marginTop: Spacing.lg },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
});
