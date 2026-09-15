export type RootStackParamList = {
  Main: undefined;
  Lesson: { lessonId: string };
  Result: { xpEarned: number; correctCount: number; totalCount: number };
  Streak: undefined;
  Settings: undefined;
  Objective: { unitId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Practice: undefined;
  Profile: undefined;
};
