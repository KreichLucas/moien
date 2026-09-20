import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Lesson: { lessonId: string };
  Result: {
    xpEarned: number;
    correctCount: number;
    totalCount: number;
    elapsedSeconds: number;
    lives: number;
    unitTitle?: string;
    lessonTitle?: string;
  };
  Streak: undefined;
  Settings: undefined;
  OutOfDiamonds: { lessonId: string };
  DiamondRecovery: { lessonId: string };
  Learn: undefined;
  Achievements: undefined;
  AllModules: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Practice: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};
