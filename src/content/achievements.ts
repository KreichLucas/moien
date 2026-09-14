import { ProgressState } from '../state/progressStorage';
import { CEFRLevel, Unit } from '../types/content';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: (progress: ProgressState, units: Unit[]) => boolean;
}

function isLevelComplete(units: Unit[], completedLessonIds: string[], level: CEFRLevel): boolean {
  const lessons = units.filter((u) => u.level === level).flatMap((u) => u.lessons);
  if (lessons.length === 0) return false;
  return lessons.every((l) => completedLessonIds.includes(l.id));
}

function countAtDomainLevel(progress: ProgressState, minLevel: number): number {
  return Object.values(progress.itemMastery).filter((s) => s.domainLevel >= minLevel).length;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_lesson',
    title: 'Primeiro passo',
    description: 'Complete sua primeira lição',
    icon: '🌱',
    isUnlocked: (p) => p.completedLessonIds.length >= 1,
  },
  {
    id: 'ten_lessons',
    title: 'Pegando o ritmo',
    description: 'Complete 10 lições',
    icon: '📚',
    isUnlocked: (p) => p.completedLessonIds.length >= 10,
  },
  {
    id: 'twentyfive_lessons',
    title: 'Dedicado',
    description: 'Complete 25 lições',
    icon: '🎓',
    isUnlocked: (p) => p.completedLessonIds.length >= 25,
  },
  {
    id: 'perfect_lesson',
    title: 'Perfeccionista',
    description: 'Complete uma lição sem nenhum erro',
    icon: '💯',
    isUnlocked: (p) => p.perfectLessonIds.length >= 1,
  },
  {
    id: 'perfect_five',
    title: 'Sem erros',
    description: 'Complete 5 lições sem nenhum erro',
    icon: '✨',
    isUnlocked: (p) => p.perfectLessonIds.length >= 5,
  },
  {
    id: 'streak_3',
    title: 'Constância',
    description: 'Alcance uma ofensiva de 3 dias',
    icon: '🔥',
    isUnlocked: (p) => p.maxStreak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Sociedade da Chama Acesa',
    description: 'Alcance uma ofensiva de 7 dias',
    icon: '🔥',
    isUnlocked: (p) => p.maxStreak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Imparável',
    description: 'Alcance uma ofensiva de 30 dias',
    icon: '🏅',
    isUnlocked: (p) => p.maxStreak >= 30,
  },
  {
    id: 'xp_100',
    title: 'Cem por cento',
    description: 'Alcance 100 XP',
    icon: '⭐',
    isUnlocked: (p) => p.xp >= 100,
  },
  {
    id: 'xp_500',
    title: 'Quinhentão',
    description: 'Alcance 500 XP',
    icon: '🌟',
    isUnlocked: (p) => p.xp >= 500,
  },
  {
    id: 'xp_1000',
    title: 'Mil e uma noites',
    description: 'Alcance 1.000 XP',
    icon: '💫',
    isUnlocked: (p) => p.xp >= 1000,
  },
  {
    id: 'level_a1',
    title: 'Nível A1 concluído',
    description: 'Complete todas as lições do nível A1',
    icon: '🏆',
    isUnlocked: (p, units) => isLevelComplete(units, p.completedLessonIds, 'A1'),
  },
  {
    id: 'vocab_50',
    title: '50 palavras dominadas',
    description: 'Alcance domínio real (uso com ajuda ou mais) em 50 itens',
    icon: '🧠',
    isUnlocked: (p) => countAtDomainLevel(p, 4) >= 50,
  },
  {
    id: 'vocab_mastery_20',
    title: 'Domínio total',
    description: 'Alcance o nível máximo de domínio em 20 itens',
    icon: '👑',
    isUnlocked: (p) => countAtDomainLevel(p, 6) >= 20,
  },
];

export function getAchievementsStatus(progress: ProgressState, units: Unit[]) {
  return ACHIEVEMENTS.map((a) => ({ ...a, unlocked: a.isUnlocked(progress, units) }));
}
