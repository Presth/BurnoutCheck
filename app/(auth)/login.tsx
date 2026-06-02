import { useState } from 'react';
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useThemeColors';
import { isFirebaseAppConfigured, isFirebaseConfigured } from '@/services/firebase';
import { FontSize, Radius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { user, signInWithGoogle, signInDemo } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/(app)/(tabs)');
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      Alert.alert('Sign-in Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setLoading(true);
    try {
      await signInDemo();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.logo}>
              <FontAwesome name="leaf" size={36} color={colors.primary} />
            </View>
            <Text style={styles.appName}>BurnoutCheck</Text>
            <Text style={styles.tagline}>
              Track your daily habits, understand burnout risk, and get supportive wellness tips.
            </Text>
          </View>

          <Card style={styles.card}>
            <Text style={[styles.welcome, { color: colors.text }]}>Welcome, Student 👋</Text>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Sign in to save your logs and track your wellness journey over time.
            </Text>

            {isFirebaseConfigured ? (
              <Button
                title="Continue with Google"
                onPress={handleGoogleSignIn}
                loading={loading}
                style={{ marginTop: Spacing.lg }}
                icon={<FontAwesome name="google" size={18} color="#fff" />}
              />
            ) : (
              <>
                <View style={[styles.notice, { backgroundColor: colors.accent + '30' }]}>
                  <FontAwesome name="info-circle" size={16} color={colors.primary} />
                  <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                    {isFirebaseAppConfigured
                      ? 'Google Sign-In needs a Firebase matching Web client ID. Try demo mode while you update it.'
                      : 'Firebase not configured yet. Try demo mode to explore the app.'}
                  </Text>
                </View>
                <Button
                  title="Explore Demo Mode"
                  onPress={handleDemo}
                  loading={loading}
                  style={{ marginTop: Spacing.md }}
                />
              </>
            )}

            {isFirebaseConfigured && (
              <Button
                title="Try Demo Mode"
                onPress={handleDemo}
                variant="ghost"
                disabled={loading}
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </Card>

          <Text style={styles.footer}>
            Built for Nigerian university students · Your data stays private
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: '#fff',
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  welcome: {
    fontSize: FontSize.xl,
    fontWeight: '600',
  },
  hint: {
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.xs,
  },
});
