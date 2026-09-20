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

// The lesson screen's "natural" (unscaled) design width, shared by the
// header and the exam card so the whole thing measures as one coherent
// block for the no-scroll auto-fit transform (see `useAutoFitScale`) —
// a stretched-to-the-page-edge header would have no fixed natural size to
// scale from, and a mismatched width between the two would look unaligned
// once scaled.
export const CONTENT_WIDTH = 700;

export function makeLessonChromeStyles() {
  return StyleSheet.create({
    page: {
      flex: 1,
      minHeight: '100%',
      backgroundColor: authColors.pageBg,
      overflow: 'hidden',
    },
    // Fills the viewport and centers whatever's inside — the auto-fit scale
    // transform lives on the child measured against this box's own size.
    stage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    scaleContent: { alignItems: 'center' },
    header: {
      width: CONTENT_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingBottom: 16,
    },
    // Below the breakpoint, `centerColumn`'s own minWidth plus the exit
    // link and diamonds on either side add up to more than the available
    // width — flexWrap alone doesn't reliably move a `flex: 1` item to a
    // new line before it overflows, so this stacks the three sections
    // explicitly instead (same fix already used on the result/all-modules
    // headers).
    headerNarrow: { flexDirection: 'column', gap: 10 },
    exitButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
    exitButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textPrimary },
    centerColumn: { flex: 1, minWidth: 160, alignItems: 'center', gap: 6 },
    centerColumnNarrow: { flex: 0, minWidth: 0, width: '100%' },
    breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    breadcrumbUnit: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
    breadcrumbSeparator: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary },
    breadcrumbLesson: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary },
    exerciseCounter: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary },
    examCard: {
      width: CONTENT_WIDTH,
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
