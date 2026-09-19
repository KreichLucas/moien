export interface DailyPhrase {
  lu: string;
  pt: string;
}

/**
 * Pulled from phrases already taught/verified in unitsA1Objectives.ts (not
 * invented here), so the "phrase of the day" never shows the learner
 * something the course itself doesn't stand behind.
 */
export const DAILY_PHRASES: DailyPhrase[] = [
  { lu: 'Moien! Wéi geet et?', pt: 'Olá! Como vai?' },
  { lu: 'Wéi heeschs du?', pt: 'Qual é o seu nome?' },
  { lu: 'Et geet mir gutt', pt: 'Estou bem' },
  { lu: 'Merci fir Ären Hëllef', pt: 'Obrigado pela sua ajuda' },
  { lu: 'Gär geschitt', pt: 'De nada' },
  { lu: 'Bis Bald', pt: 'Até logo' },
  { lu: 'Gudde Mëtteg', pt: 'Boa tarde' },
  { lu: 'Gutt Nuecht', pt: 'Boa noite' },
];

/** Deterministic by day-of-year, so it's the same phrase all day and changes on its own tomorrow. */
export function getPhraseOfTheDay(date: Date = new Date()): DailyPhrase {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return DAILY_PHRASES[dayOfYear % DAILY_PHRASES.length];
}
