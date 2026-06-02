import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyLogForm } from '@/types';

const DRAFT_KEY = '@burnoutcheck/log_draft';

export async function saveLogDraft(form: DailyLogForm): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(form));
}

export async function loadLogDraft(): Promise<DailyLogForm | null> {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearLogDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}
