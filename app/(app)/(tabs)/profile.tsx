import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/components/useColorScheme';
import { getAssessments, getRecentLogs } from '@/services/firestore';
import { generateAndShareReport } from '@/services/report';
import {
  registerForPushNotifications,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '@/services/notifications';
import { isFirebaseConfigured } from '@/services/firebase';
import { FontSize, Spacing } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';

const REMINDER_KEY = 'daily_reminder_enabled';

export default function ProfileScreen() {
  const { user, signOut, isDemoMode } = useAuth();
  const colors = useThemeColors();
  const scheme = useColorScheme();
  const [reminderOn, setReminderOn] = useState(false);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync(REMINDER_KEY).then((v) => setReminderOn(v === 'true'));
    }, [])
  );

  const toggleReminder = async (value: boolean) => {
    if (value) {
      const granted = await registerForPushNotifications();
      if (!granted) {
        Alert.alert('Notifications', 'Please enable notifications in your device settings.');
        return;
      }
      await scheduleDailyReminder(20, 0);
    } else {
      await cancelDailyReminder();
    }
    await SecureStore.setItemAsync(REMINDER_KEY, value ? 'true' : 'false');
    setReminderOn(value);
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [assessments, logs] = await Promise.all([
        getAssessments(user.uid),
        getRecentLogs(user.uid, 30),
      ]);
      await generateAndShareReport(user, assessments, logs);
    } catch {
      Alert.alert('Export failed', 'Could not generate your report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>

        <Card style={styles.profileCard}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accent }]}>
              <FontAwesome name="user" size={32} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          {isDemoMode && (
            <View style={[styles.demoBadge, { backgroundColor: colors.moderate + '30' }]}>
              <Text style={{ color: colors.moderate, fontSize: FontSize.xs, fontWeight: '600' }}>
                Demo Mode
              </Text>
            </View>
          )}
        </Card>

        <Card style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <FontAwesome name="bell-o" size={18} color={colors.primary} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Daily Reminder</Text>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                8:00 PM check-in reminder
              </Text>
            </View>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={toggleReminder}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor="#fff"
          />
        </Card>

        <Card style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <FontAwesome name="moon-o" size={18} color={colors.primary} />
            <View>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.settingHint, { color: colors.textMuted }]}>
                Follows system ({scheme})
              </Text>
            </View>
          </View>
        </Card>

        <Button
          title="Download Wellness Report"
          variant="outline"
          onPress={handleExport}
          loading={exporting}
          style={{ marginBottom: Spacing.md }}
        />

        {!isFirebaseConfigured && (
          <Text style={[styles.note, { color: colors.textMuted }]}>
            Configure Firebase in .env to enable Google Sign-In and cloud sync.
          </Text>
        )}

        <Button title="Sign Out" variant="ghost" onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxl, fontWeight: '700', marginBottom: Spacing.lg },
  profileCard: { alignItems: 'center', marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: Spacing.md },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  name: { fontSize: FontSize.xl, fontWeight: '600' },
  email: { fontSize: FontSize.sm, marginTop: 4 },
  demoBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  settingLabel: { fontSize: FontSize.md, fontWeight: '500' },
  settingHint: { fontSize: FontSize.xs, marginTop: 2 },
  note: { fontSize: FontSize.xs, textAlign: 'center', marginBottom: Spacing.md },
});
