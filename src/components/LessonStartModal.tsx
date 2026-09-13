import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme/theme';

export function LessonStartModal({
  visible,
  title,
  isReview,
  isCompleted,
  onStart,
  onClose,
}: {
  visible: boolean;
  title: string;
  isReview?: boolean;
  isCompleted?: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.icon}>{isReview ? '🔁' : isCompleted ? '✓' : '★'}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {isCompleted ? 'Praticar novamente' : 'Pronto para praticar?'}
          </Text>
          <View style={styles.xpPill}>
            <Text style={styles.xpText}>⭐ +10 XP</Text>
          </View>
          <Pressable style={styles.button} onPress={onStart}>
            <Text style={styles.buttonText}>COMEÇAR</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
    },
    icon: {
      fontSize: 32,
      color: colors.buttonTextOnPrimary,
      backgroundColor: colors.accent,
      width: 56,
      height: 56,
      borderRadius: 28,
      textAlign: 'center',
      lineHeight: 56,
      overflow: 'hidden',
      marginBottom: 12,
    },
    title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6, marginBottom: 16 },
    xpPill: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginBottom: 20,
    },
    xpText: { fontSize: 14, fontWeight: '700', color: colors.text },
    button: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
    },
    buttonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  });
}
