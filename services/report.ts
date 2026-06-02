import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Assessment, BurnoutLevel, LogEntry, UserProfile } from '@/types';

const LEVEL_WEIGHT: Record<BurnoutLevel, number> = { Low: 1, Moderate: 2, High: 3 };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMultiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br/>');
}

function getAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getLevelCounts(assessments: Assessment[]): Record<BurnoutLevel, number> {
  return assessments.reduce(
    (counts, assessment) => {
      counts[assessment.burnoutLevel] += 1;
      return counts;
    },
    { Low: 0, Moderate: 0, High: 0 } as Record<BurnoutLevel, number>
  );
}

function getMostCommonLevel(assessments: Assessment[]): BurnoutLevel | 'None' {
  if (assessments.length === 0) return 'None';
  const counts = getLevelCounts(assessments);
  return (Object.keys(counts) as BurnoutLevel[]).sort((a, b) => {
    const countDiff = counts[b] - counts[a];
    return countDiff || LEVEL_WEIGHT[b] - LEVEL_WEIGHT[a];
  })[0];
}

function findLinkedLog(assessment: Assessment, logs: LogEntry[]): LogEntry | undefined {
  return logs.find((log) => log.id === assessment.linkedLogId);
}

function buildOverallRecommendation(assessments: Assessment[]): string {
  const latest = assessments[0];
  if (!latest) {
    return 'Complete a daily check-in to generate personalized wellness recommendations and begin tracking burnout patterns.';
  }

  if (latest.burnoutLevel === 'High') {
    return 'Your latest assessment is high risk. Prioritize rest, reduce non-essential academic pressure, and speak with a trusted person, mentor, or university counseling service if the pressure feels hard to manage.';
  }

  if (latest.burnoutLevel === 'Moderate') {
    return 'Your latest assessment is moderate risk. Focus on sleep quality, structured study breaks, realistic task planning, and small recovery habits over the next 24-48 hours.';
  }

  return 'Your latest assessment is low risk. Keep protecting your current routine with consistent sleep, manageable study blocks, movement, and early attention to stress before it builds.';
}

export async function generateAndShareReport(
  user: UserProfile,
  assessments: Assessment[],
  logs: LogEntry[]
): Promise<void> {
  const recentAssessments = assessments.slice(0, 14);
  const scores = assessments.map((assessment) => assessment.burnoutScore);
  const levelCounts = getLevelCounts(assessments);
  const averageScore = getAverage(scores);
  const latest = assessments[0];

  const summaryRows = recentAssessments
    .map(
      (assessment) => `
      <tr>
        <td>${escapeHtml(formatDate(assessment.createdAt))}</td>
        <td>${escapeHtml(assessment.burnoutLevel)}</td>
        <td>${escapeHtml(assessment.burnoutScore)}</td>
        <td>${escapeHtml(assessment.explanation)}</td>
      </tr>`
    )
    .join('');

  const detailedEntries = recentAssessments
    .map((assessment, index) => {
      const log = findLinkedLog(assessment, logs);
      const logDetails = log
        ? `
          <div class="metrics">
            <span>Study: ${escapeHtml(log.studyHours)}h</span>
            <span>Sleep: ${escapeHtml(log.sleepHours)}h</span>
            <span>Sleep quality: ${escapeHtml(log.sleepQuality)}/5</span>
            <span>Stress: ${escapeHtml(log.stressLevel)}/10</span>
            <span>Mood: ${escapeHtml(log.mood)}/5</span>
            <span>Workload: ${escapeHtml(log.workload)}/5</span>
            <span>Activity: ${escapeHtml(log.physicalActivity)}/5</span>
          </div>`
        : '<p class="muted">Linked daily log details are not available for this assessment.</p>';

      return `
        <section class="entry">
          <h3>${index + 1}. ${escapeHtml(formatDate(assessment.createdAt))} - ${escapeHtml(
            assessment.burnoutLevel
          )} (${escapeHtml(assessment.burnoutScore)}/100)</h3>
          ${logDetails}
          <h4>Assessment Explanation</h4>
          <p>${escapeHtml(assessment.explanation)}</p>
          <h4>Recommendations</h4>
          <p>${formatMultiline(assessment.recommendation)}</p>
        </section>`;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #1B4332; line-height: 1.45; }
        h1, h2, h3, h4 { color: #2D6A4F; margin-bottom: 8px; }
        h1 { font-size: 28px; margin-bottom: 6px; }
        h2 { font-size: 20px; margin-top: 28px; border-bottom: 2px solid #D8F3DC; padding-bottom: 6px; }
        h3 { font-size: 16px; margin-top: 0; }
        h4 { font-size: 13px; margin-top: 14px; text-transform: uppercase; letter-spacing: 0.04em; }
        p { margin: 6px 0 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
        th, td { border: 1px solid #E8F0EC; padding: 9px; text-align: left; vertical-align: top; }
        th { background: #D8F3DC; color: #1B4332; }
        .meta, .muted { color: #52796F; }
        .meta { margin-bottom: 22px; }
        .cards { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
        .card { border: 1px solid #D8F3DC; border-radius: 8px; padding: 12px; min-width: 132px; background: #F8FFFB; }
        .label { color: #52796F; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .value { display: block; color: #1B4332; font-size: 20px; font-weight: 700; margin-top: 4px; }
        .recommendation { background: #F1FAF4; border-left: 4px solid #40916C; padding: 12px 14px; margin-top: 12px; }
        .entry { page-break-inside: avoid; border: 1px solid #E8F0EC; border-radius: 8px; padding: 14px; margin-top: 14px; }
        .metrics { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 12px; }
        .metrics span { background: #F1FAF4; border: 1px solid #D8F3DC; border-radius: 6px; padding: 6px 8px; font-size: 12px; }
        .footer { margin-top: 32px; font-size: 12px; color: #84A98C; }
      </style>
    </head>
    <body>
      <h1>BurnoutCheck Wellness Report</h1>
      <p class="meta">
        Student: ${escapeHtml(user.name)}<br/>
        Email: ${escapeHtml(user.email)}<br/>
        Generated: ${escapeHtml(formatDate(new Date().toISOString()))}<br/>
        Total logs: ${escapeHtml(logs.length)} | Assessments: ${escapeHtml(assessments.length)}
      </p>

      <h2>Overall Summary</h2>
      <div class="cards">
        <div class="card"><span class="label">Latest level</span><span class="value">${escapeHtml(
          latest?.burnoutLevel ?? 'None'
        )}</span></div>
        <div class="card"><span class="label">Latest score</span><span class="value">${escapeHtml(
          latest?.burnoutScore ?? 'N/A'
        )}</span></div>
        <div class="card"><span class="label">Average score</span><span class="value">${escapeHtml(
          averageScore || 'N/A'
        )}</span></div>
        <div class="card"><span class="label">Most common</span><span class="value">${escapeHtml(
          getMostCommonLevel(assessments)
        )}</span></div>
      </div>
      <p>
        Low: ${escapeHtml(levelCounts.Low)} | Moderate: ${escapeHtml(levelCounts.Moderate)} | High:
        ${escapeHtml(levelCounts.High)}
      </p>
      <div class="recommendation">
        <strong>Overall recommendation:</strong><br/>
        ${escapeHtml(buildOverallRecommendation(assessments))}
      </div>

      <h2>Recent Assessment Table</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Level</th><th>Score</th><th>Assessment note</th></tr>
        </thead>
        <tbody>${summaryRows || '<tr><td colspan="4">No assessments yet</td></tr>'}</tbody>
      </table>

      <h2>Detailed Logs And Recommendations</h2>
      ${
        detailedEntries ||
        '<p class="muted">No detailed assessment entries are available yet. Complete a daily check-in to include personalized recommendations in this report.</p>'
      }

      <p class="footer">
        BurnoutCheck - AI-Powered Student Burnout Assessment<br/>
        This report is for personal wellness tracking, not medical diagnosis.
      </p>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share BurnoutCheck Report',
      UTI: 'com.adobe.pdf',
    });
  }
}
