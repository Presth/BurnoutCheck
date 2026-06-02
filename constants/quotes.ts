export const WELLNESS_QUOTES = [
  'Small steps today lead to stronger tomorrows.',
  'Rest is part of progress, not a pause from it.',
  'Your pace is valid — consistency beats intensity.',
  'Taking care of yourself helps you show up for your goals.',
  'One mindful break can reset your whole afternoon.',
  'You are allowed to ask for help and take breaks.',
  'Balance is built daily, not discovered once.',
];

export function getDailyQuote(): string {
  const dayIndex = new Date().getDate() % WELLNESS_QUOTES.length;
  return WELLNESS_QUOTES[dayIndex];
}
