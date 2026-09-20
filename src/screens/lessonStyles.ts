import { StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/theme';
import { authColors, fontFamilies, liftStyle } from './authStyles';

export { fontFamilies, liftStyle };

/**
 * `ThemeColors`-shaped palette for the lesson-taking flow (LessonScreen and
 * every Exercise* component), reusing the same fixed dark-navy/cyan brand
 * identity as Login/SignUp/Dashboard — deliberately independent of the
 * light/dark `theme.ts` used elsewhere, exactly like `authColors`. Every
 * Exercise* component already takes its colors as a `ThemeColors`-typed
 * prop (via `useTheme()`); swapping that source for this constant is the
 * entire reskin — no component logic, props, or handlers change.
 */
export const lessonColors: ThemeColors = {
  background: authColors.pageBg,
  surface: authColors.cardBg,
  border: authColors.cardBorder,
  text: authColors.textPrimary,
  textSecondary: authColors.textSecondary,
  primary: authColors.accentCyan,
  accent: authColors.accentCyan,
  danger: authColors.danger,
  correctBg: 'rgba(34, 197, 94, 0.16)',
  correctBorder: '#22C55E',
  wrongBg: 'rgba(255, 122, 122, 0.16)',
  wrongBorder: authColors.danger,
  selectedBg: 'rgba(56, 189, 248, 0.14)',
  selectedBorder: authColors.accentCyan,
  locked: authColors.inputBorder,
  buttonTextOnPrimary: '#FFFFFF',
  streakActiveBg: 'rgba(56, 189, 248, 0.14)',
  streakActiveBorder: authColors.accentCyan,
  shadowOpacity: 0.35,
  shadowRadius: 16,
  elevation: 6,
};

export function makeLessonChromeStyles() {
  return StyleSheet.create({
    page: {
      flex: 1,
      minHeight: '100%',
      backgroundColor: authColors.pageBg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      flexWrap: 'wrap',
    },
    exitButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
    exitButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textPrimary },
    centerColumn: { flex: 1, minWidth: 200, alignItems: 'center', gap: 6 },
    breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    breadcrumbUnit: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
    breadcrumbSeparator: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary },
    breadcrumbLesson: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary },
    exerciseCounter: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary },
    scroll: { flex: 1 },
    // `flexGrow: 1` + `justifyContent: 'center'` centers the card vertically
    // when it's shorter than the viewport (most exercises), while still
    // scrolling normally once content is taller than the available space.
    scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 20 },
    examCard: {
      width: '100%',
      maxWidth: 680,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 32,
      paddingVertical: 28,
      paddingHorizontal: 8,
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
      elevation: 12,
    },
    examBadgeRow: { alignItems: 'center', marginBottom: 18 },
    examBadge: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 12,
      letterSpacing: 0.8,
      color: authColors.accentCyan,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
  });
}
