import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/theme';

export function useThemeColors() {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
}
