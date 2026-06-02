import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FontSize, Spacing } from '@/constants/theme';

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const colors = useThemeColors();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        router.replace('/(app)/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [loading, user, router]);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <FontAwesome name="leaf" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>BurnoutCheck</Text>
        <Text style={styles.subtitle}>Your calm wellness companion</Text>
        <ActivityIndicator color="#fff" style={{ marginTop: Spacing.xl }} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.sm,
  },
});
