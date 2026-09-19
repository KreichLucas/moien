import { StyleSheet } from 'react-native';
import { ThemeColors, cardShadow } from '../theme/theme';

export function makeAuthStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 32,
    },
    form: { width: '100%' },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      color: colors.text,
      marginBottom: 12,
    },
    error: { fontSize: 13, color: colors.danger, marginBottom: 12, textAlign: 'center' },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
      ...cardShadow(colors),
    },
    buttonDisabled: { opacity: 0.6 },
    primaryButtonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
    linkRow: { marginTop: 20, alignItems: 'center' },
    linkText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  });
}
