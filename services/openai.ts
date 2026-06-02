import type { DailyLogForm, BurnoutLevel } from '@/types';

const FALLBACK_RECOMMENDATIONS: Record<BurnoutLevel, string> = {
  Low: `Daily assessment:
Your burnout risk looks low today, which suggests your current balance of study, rest, mood, stress, and activity is generally supportive. Keep protecting the habits that are working instead of waiting until stress becomes serious.

What may be helping:
* Your daily log suggests enough recovery to keep pressure manageable.
* Your current routine may be giving you space for study, rest, and movement.
* Low risk does not mean "do everything"; it means your balance is worth protecting.

Detailed recommendations:
* Maintain a steady sleep window and aim for 7-8 hours so your body can recover after classes, assignments, and screen time.
* Keep study blocks structured with short breaks, especially before long reading or revision sessions.
* Add one light movement routine today, such as a walk around campus, stretching, or a short workout.
* Notice what helped today and repeat it tomorrow, because consistency is what keeps low risk low.`,
  Moderate: `Daily assessment:
Your burnout risk is moderate today, which means some pressure signs are building but there is still room to reset before it becomes overwhelming. The best approach is to reduce the load slightly, protect sleep, and add recovery into the day.

What may be contributing:
* Academic pressure, stress, sleep quality, workload, or low activity may be affecting your recovery.
* Moderate risk can grow when small stress signals are ignored for several days.
* You do not need a perfect routine today; you need a realistic one.

Detailed recommendations:
* Use focused study blocks, such as 25 minutes of work followed by 5 minutes of rest, so your brain gets regular recovery.
* Choose the most important academic task for today and postpone or simplify anything that is not urgent.
* Reduce screen time before bed and create a calmer wind-down routine so sleep quality can improve.
* Eat, hydrate, and take a short walk before another long study session.
* Talk with a trusted friend, course mate, mentor, or counselor if the stress has lasted for several days.`,
  High: `Daily assessment:
Your burnout risk is high today, so your body and mind may be asking for real recovery, not just more discipline. Treat today as a support-and-stabilize day where rest, safety, and help matter more than pushing harder.

What may be contributing:
* Your log may show a difficult mix of high stress, low sleep, heavy workload, low mood, or limited physical activity.
* High risk often means recovery has been too low for the amount of pressure you are carrying.
* This is a sign to reduce strain and ask for support where possible.

Detailed recommendations:
* Prioritize sleep and recovery tonight, and reduce your study target to the smallest essential task if possible.
* Take a 20-minute walk, stretch, shower, eat properly, or do another grounding activity before returning to academic work.
* Break urgent tasks into very small steps and ask for an extension, academic support, or help from a course mate where realistic.
* Avoid isolating yourself today; message or call someone you trust.
* If you feel unable to cope, reach out to your university counseling service, a trusted person, or local emergency support. You deserve support, not silence.`,
};

export async function generateRecommendations(
  form: DailyLogForm,
  burnoutLevel: BurnoutLevel,
  burnoutScore: number,
  explanation: string
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    return FALLBACK_RECOMMENDATIONS[burnoutLevel];
  }

  const prompt = `You are a friendly wellness assistant for Nigerian university students. Based on this daily log and burnout assessment, write a detailed but readable wellness assessment and recommendation plan. Keep it supportive, practical, culturally aware, and non-clinical.

Daily log:
* Study hours: ${form.studyHours}
* Sleep: ${form.sleepHours} hours
* Sleep quality: ${form.sleepQuality}/5
* Stress: ${form.stressLevel}/10
* Mood: ${form.mood}/5
* Workload: ${form.workload}/5
* Physical activity: ${form.physicalActivity}/5

Burnout result:
* Level: ${burnoutLevel}
* Score: ${burnoutScore}/100
* Context: ${explanation}

Include:
1. A "Daily assessment" section that explains what the score means and connects it to the student's exact log values.
2. A "What may be contributing" section with 3-5 specific factors from the log.
3. A "Detailed recommendations" section with 5-7 concrete actions for the next 24-48 hours.
4. A "When to seek support" note if the risk is Moderate or High.

Format with short headings and bullet-style tips using * characters. Avoid medical diagnosis, alarming language, and generic filler. Aim for 300-450 words.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You help students manage burnout with practical, kind advice. Give detailed, personalized guidance while staying non-clinical and encouraging.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return FALLBACK_RECOMMENDATIONS[burnoutLevel];
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || FALLBACK_RECOMMENDATIONS[burnoutLevel];
  } catch {
    return FALLBACK_RECOMMENDATIONS[burnoutLevel];
  }
}
