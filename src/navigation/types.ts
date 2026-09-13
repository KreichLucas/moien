export type RootStackParamList = {
  Main: undefined;
  Lesson: { lessonId: string };
  Result: { xpEarned: number; correctCount: number; totalCount: number };
};

export type MainTabParamList = {
  Home: undefined;
  Profile: undefined;
};
