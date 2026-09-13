import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  accent: string;
  danger: string;
  correctBg: string;
  correctBorder: string;
  wrongBg: string;
  wrongBorder: string;
  selectedBg: string;
  selectedBorder: string;
  locked: string;
  buttonTextOnPrimary: string;
  streakActiveBg: string;
  streakActiveBorder: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F7F7F7',
  border: '#E5E5E5',
  text: '#3C3C3C',
  textSecondary: '#777777',
  primary: '#58CC02',
  accent: '#1CB0F6',
  danger: '#FF4B4B',
  correctBg: '#D7FFB8',
  correctBorder: '#58CC02',
  wrongBg: '#FFDFE0',
  wrongBorder: '#FF4B4B',
  selectedBg: '#DDF4FF',
  selectedBorder: '#1CB0F6',
  locked: '#E5E5E5',
  buttonTextOnPrimary: '#FFFFFF',
  streakActiveBg: '#FFECC7',
  streakActiveBorder: '#FF9600',
};

export const darkTheme: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  border: '#38383A',
  text: '#F2F2F7',
  textSecondary: '#98989F',
  primary: '#58CC02',
  accent: '#1CB0F6',
  danger: '#FF6961',
  correctBg: '#173410',
  correctBorder: '#58CC02',
  wrongBg: '#3A1213',
  wrongBorder: '#FF6961',
  selectedBg: '#0B2C3D',
  selectedBorder: '#1CB0F6',
  locked: '#2C2C2E',
  buttonTextOnPrimary: '#FFFFFF',
  streakActiveBg: '#3D2A0A',
  streakActiveBorder: '#FF9600',
};

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
