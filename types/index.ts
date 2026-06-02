export type BurnoutLevel = 'Low' | 'Moderate' | 'High';

export type MoodLabel = 'Very Low' | 'Low' | 'Okay' | 'Good' | 'Great';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  createdAt: string;
}

export interface LogEntry {
  id?: string;
  userId: string;
  studyHours: number;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  mood: number;
  workload: number;
  physicalActivity: number;
  createdAt: string;
}

export interface Assessment {
  id?: string;
  userId: string;
  burnoutLevel: BurnoutLevel;
  burnoutScore: number;
  explanation: string;
  recommendation: string;
  linkedLogId: string;
  createdAt: string;
}

export interface BurnoutResult {
  burnoutLevel: BurnoutLevel;
  burnoutScore: number;
  explanation: string;
}

export interface DailyLogForm {
  studyHours: number;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  mood: number;
  workload: number;
  physicalActivity: number;
}

export const MOOD_LABELS: MoodLabel[] = ['Very Low', 'Low', 'Okay', 'Good', 'Great'];

export const SLEEP_QUALITY_LABELS = ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'];

export const WORKLOAD_LABELS = ['Light', 'Moderate', 'Busy', 'Heavy', 'Overwhelming'];

export const ACTIVITY_LABELS = ['None', 'Light', 'Moderate', 'Active', 'Very Active'];
