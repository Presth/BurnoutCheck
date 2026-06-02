import type { Assessment, LogEntry } from "@/types";
import { assessBurnout } from "./burnoutClassifier";

const DEMO_USER_ID = "demo-user-001";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const sampleLogs: Omit<LogEntry, "id" | "userId">[] = [
  {
    studyHours: 6,
    sleepHours: 7,
    sleepQuality: 4,
    stressLevel: 4,
    mood: 4,
    workload: 3,
    physicalActivity: 3,
    createdAt: daysAgo(6),
  },
  {
    studyHours: 8,
    sleepHours: 6,
    sleepQuality: 3,
    stressLevel: 6,
    mood: 3,
    workload: 4,
    physicalActivity: 2,
    createdAt: daysAgo(5),
  },
  {
    studyHours: 5,
    sleepHours: 8,
    sleepQuality: 5,
    stressLevel: 3,
    mood: 5,
    workload: 2,
    physicalActivity: 4,
    createdAt: daysAgo(4),
  },
  {
    studyHours: 9,
    sleepHours: 5,
    sleepQuality: 2,
    stressLevel: 8,
    mood: 2,
    workload: 5,
    physicalActivity: 1,
    createdAt: daysAgo(3),
  },
  {
    studyHours: 7,
    sleepHours: 6,
    sleepQuality: 3,
    stressLevel: 5,
    mood: 3,
    workload: 4,
    physicalActivity: 2,
    createdAt: daysAgo(2),
  },
  {
    studyHours: 6,
    sleepHours: 7,
    sleepQuality: 4,
    stressLevel: 4,
    mood: 4,
    workload: 3,
    physicalActivity: 3,
    createdAt: daysAgo(1),
  },
  {
    studyHours: 4,
    sleepHours: 8,
    sleepQuality: 5,
    stressLevel: 2,
    mood: 5,
    workload: 2,
    physicalActivity: 4,
    createdAt: daysAgo(0),
  },
];

export function generateDemoLogs(): LogEntry[] {
  return sampleLogs.map((log, i) => ({
    ...log,
    id: `demo-log-${i}`,
    userId: DEMO_USER_ID,
  }));
}

export function generateDemoAssessments(logs: LogEntry[]): Assessment[] {
  const defaultRec =
    "Take short breaks between study blocks, aim for 7–8 hours of sleep, and schedule light physical activity this week.";

  return logs.map((log, i) => {
    const result = assessBurnout(log);
    return {
      id: `demo-assessment-${i}`,
      userId: DEMO_USER_ID,
      burnoutLevel: result.burnoutLevel,
      burnoutScore: result.burnoutScore,
      explanation: result.explanation,
      recommendation: defaultRec,
      linkedLogId: log.id!,
      createdAt: log.createdAt,
    };
  });
}

export const DEMO_USER = {
  uid: DEMO_USER_ID,
  name: "Ada Student",
  email: "ada.student@jabu.edu.ng",
  photoURL: undefined,
  createdAt: daysAgo(30),
};
