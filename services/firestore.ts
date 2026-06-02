import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured } from './firebase';
import type { UserProfile, LogEntry, Assessment } from '@/types';
import { generateDemoAssessments, generateDemoLogs } from '@/lib/dummyData';

const DEMO_LOGS_KEY = '@burnoutcheck/demo_logs';
const DEMO_ASSESSMENTS_KEY = '@burnoutcheck/demo_assessments';

async function getDemoLogs(userId: string): Promise<LogEntry[]> {
  const stored = await AsyncStorage.getItem(DEMO_LOGS_KEY);
  if (stored) return JSON.parse(stored);
  const logs = generateDemoLogs().map((l) => ({ ...l, userId }));
  await AsyncStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
  return logs;
}

async function getDemoAssessments(userId: string): Promise<Assessment[]> {
  const stored = await AsyncStorage.getItem(DEMO_ASSESSMENTS_KEY);
  if (stored) return JSON.parse(stored);
  const logs = await getDemoLogs(userId);
  const assessments = generateDemoAssessments(logs).map((a) => ({ ...a, userId }));
  await AsyncStorage.setItem(DEMO_ASSESSMENTS_KEY, JSON.stringify(assessments));
  return assessments;
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  if (!isFirebaseConfigured) return;
  await setDoc(doc(db, 'users', user.uid), user, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createLogEntry(entry: Omit<LogEntry, 'id'>): Promise<string> {
  if (!isFirebaseConfigured) {
    const logs = await getDemoLogs(entry.userId);
    const id = `log-${Date.now()}`;
    const newLog: LogEntry = { ...entry, id };
    logs.unshift(newLog);
    await AsyncStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
    return id;
  }
  const ref = await addDoc(collection(db, 'logEntries'), {
    ...entry,
    createdAt: entry.createdAt || new Date().toISOString(),
  });
  return ref.id;
}

export async function createAssessment(assessment: Omit<Assessment, 'id'>): Promise<string> {
  if (!isFirebaseConfigured) {
    const list = await getDemoAssessments(assessment.userId);
    const id = `assessment-${Date.now()}`;
    const newItem: Assessment = { ...assessment, id };
    list.unshift(newItem);
    await AsyncStorage.setItem(DEMO_ASSESSMENTS_KEY, JSON.stringify(list));
    return id;
  }
  const ref = await addDoc(collection(db, 'assessments'), assessment);
  return ref.id;
}

export async function getRecentLogs(userId: string, count = 7): Promise<LogEntry[]> {
  if (!isFirebaseConfigured) {
    const logs = await getDemoLogs(userId);
    return logs.slice(0, count);
  }
  const q = query(
    collection(db, 'logEntries'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LogEntry));
}

export async function getAssessments(userId: string, max = 30): Promise<Assessment[]> {
  if (!isFirebaseConfigured) {
    const list = await getDemoAssessments(userId);
    return list.slice(0, max);
  }
  const q = query(
    collection(db, 'assessments'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Assessment));
}

export async function getLatestAssessment(userId: string): Promise<Assessment | null> {
  const list = await getAssessments(userId, 1);
  return list[0] ?? null;
}

export async function seedDemoDataIfEmpty(userId: string): Promise<void> {
  if (isFirebaseConfigured) return;
  await getDemoLogs(userId);
  await getDemoAssessments(userId);
}
