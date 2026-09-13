import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgressState {
  xp: number;
  streak: number;
  maxStreak: number;
  lastActiveDate: string | null;
  completedLessonIds: string[];
  activeDates: string[];
  perfectLessonIds: string[];
}

export const initialProgressState: ProgressState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  lastActiveDate: null,
  completedLessonIds: [],
  activeDates: [],
  perfectLessonIds: [],
};

const STORAGE_KEY = 'moien:progress';

export async function loadProgress(): Promise<ProgressState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return initialProgressState;
  try {
    return { ...initialProgressState, ...JSON.parse(raw) };
  } catch {
    return initialProgressState;
  }
}

export async function saveProgress(state: ProgressState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearProgress(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
