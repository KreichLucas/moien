import { normalizeWord, stripLeadingArticle } from '../content/wordNormalization';
import { ErrorType } from './types';

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) d[i][0] = i;
  for (let j = 0; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[rows - 1][cols - 1];
}

const CLOSE_MISS_MAX_DISTANCE = 2;

/**
 * Only meaningful for free-typed `translate` answers — every other exercise
 * type is a discrete pick with no string to diff against, and always
 * reports `'other'` on a miss.
 */
export function classifyTranslateError(userAnswer: string, correctAnswer: string): ErrorType {
  const userNorm = normalizeWord(userAnswer);
  const correctNorm = normalizeWord(correctAnswer);

  const userBare = normalizeWord(stripLeadingArticle(userAnswer));
  const correctBare = normalizeWord(stripLeadingArticle(correctAnswer));
  if (userBare === correctBare && userNorm !== correctNorm) return 'wrong-article';

  if (levenshtein(userNorm, correctNorm) <= CLOSE_MISS_MAX_DISTANCE) return 'close-miss';

  return 'other';
}
