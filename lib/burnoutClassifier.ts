import type { DailyLogForm, BurnoutLevel, BurnoutResult } from '@/types';

/**
 * Transparent burnout classifier inspired by Decision Tree / Random Forest logic.
 * Three independent "trees" vote on level; scores are averaged for interpretability.
 */

type Features = DailyLogForm;

function treeSleepStress(f: Features): { level: BurnoutLevel; score: number } {
  let score = 0;
  if (f.sleepHours < 5) score += 35;
  else if (f.sleepHours < 7) score += 20;
  else score += 8;

  if (f.sleepQuality <= 2) score += 25;
  else if (f.sleepQuality <= 3) score += 12;

  if (f.stressLevel >= 8) score += 30;
  else if (f.stressLevel >= 5) score += 18;

  return classify(score);
}

function treeStudyWorkload(f: Features): { level: BurnoutLevel; score: number } {
  let score = 0;
  if (f.studyHours > 10) score += 30;
  else if (f.studyHours > 8) score += 18;
  else if (f.studyHours > 6) score += 10;

  if (f.workload >= 5) score += 28;
  else if (f.workload >= 4) score += 18;
  else if (f.workload >= 3) score += 8;

  if (f.physicalActivity <= 1) score += 15;
  else if (f.physicalActivity <= 2) score += 8;

  return classify(score);
}

function treeMoodBalance(f: Features): { level: BurnoutLevel; score: number } {
  let score = 0;
  if (f.mood <= 1) score += 35;
  else if (f.mood <= 2) score += 22;
  else if (f.mood <= 3) score += 10;

  const imbalance = f.studyHours / Math.max(f.sleepHours, 1);
  if (imbalance > 2) score += 25;
  else if (imbalance > 1.5) score += 12;

  if (f.stressLevel >= 7 && f.mood <= 3) score += 20;

  return classify(score);
}

function classify(rawScore: number): { level: BurnoutLevel; score: number } {
  const score = Math.min(100, Math.round(rawScore));
  let level: BurnoutLevel = 'Low';
  if (score >= 65) level = 'High';
  else if (score >= 35) level = 'Moderate';
  return { level, score };
}

function majorityLevel(levels: BurnoutLevel[]): BurnoutLevel {
  const counts: Record<BurnoutLevel, number> = { Low: 0, Moderate: 0, High: 0 };
  levels.forEach((l) => counts[l]++);
  if (counts.High >= 2) return 'High';
  if (counts.Moderate >= 2) return 'Moderate';
  if (counts.High === 1 && counts.Moderate === 1) return 'Moderate';
  return 'Low';
}

function buildExplanation(f: Features, level: BurnoutLevel, score: number): string {
  const factors: string[] = [];

  if (f.sleepHours < 6) factors.push('limited sleep');
  if (f.sleepQuality <= 2) factors.push('poor sleep quality');
  if (f.stressLevel >= 7) factors.push('elevated stress');
  if (f.mood <= 2) factors.push('low mood');
  if (f.studyHours > 8) factors.push('long study hours');
  if (f.workload >= 4) factors.push('heavy workload');
  if (f.physicalActivity <= 2) factors.push('low physical activity');

  const factorText =
    factors.length > 0
      ? factors.slice(0, 3).join(', ')
      : 'balanced daily habits';

  if (level === 'Low') {
    return `Your score of ${score} suggests healthy balance. Key factors: ${factorText}. Keep up your wellness routines.`;
  }
  if (level === 'Moderate') {
    return `Your score of ${score} indicates moderate burnout risk, mainly due to ${factorText}. Small adjustments can help restore balance.`;
  }
  return `Your score of ${score} signals high burnout risk, driven by ${factorText}. Prioritize rest and reach out for support if needed.`;
}

export function assessBurnout(form: DailyLogForm): BurnoutResult {
  const trees = [treeSleepStress(form), treeStudyWorkload(form), treeMoodBalance(form)];
  const avgScore = Math.round(trees.reduce((s, t) => s + t.score, 0) / trees.length);
  const level = majorityLevel(trees.map((t) => t.level));
  const explanation = buildExplanation(form, level, avgScore);

  return {
    burnoutLevel: level,
    burnoutScore: avgScore,
    explanation,
  };
}
