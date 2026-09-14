import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { resetProgress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleConfirmReset = () => {
    resetProgress();
    setConfirmVisible(false);
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Progresso</Text>
        <Pressable
          style={({ pressed }) => [styles.dangerRow, pressedStyle(pressed)]}
          onPress={() => setConfirmVisible(true)}
        >
          <Text style={styles.dangerText}>Resetar progresso</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Text style={styles.hint}>Apaga XP, ofensiva, conquistas e lições completas neste aparelho.</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Moien! · v1.0.0</Text>
      </View>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmVisible(false)}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardIcon}>⚠️</Text>
            <Text style={styles.cardTitle}>Resetar todo o progresso?</Text>
            <Text style={styles.cardSubtitle}>
              Essa ação não pode ser desfeita. Você vai perder seu XP, ofensiva, lições completas e
              conquistas.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.cardDangerButton, pressedStyle(pressed)]}
              onPress={handleConfirmReset}
            >
              <Text style={styles.cardDangerButtonText}>SIM, RESETAR</Text>
            </Pressable>
            <Pressable style={styles.cardCancelButton} onPress={() => setConfirmVisible(false)}>
              <Text style={styles.cardCancelButtonText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20, paddingTop: 60 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 28,
    },
    close: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    headerSpacer: { width: 22 },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 16,
      ...cardShadow(colors),
    },
    dangerText: { fontSize: 15, fontWeight: '700', color: colors.danger },
    chevron: { fontSize: 18, color: colors.textSecondary },
    hint: { fontSize: 12, color: colors.textSecondary, marginTop: 8, lineHeight: 17 },
    footer: { marginTop: 'auto', alignItems: 'center', paddingBottom: 20 },
    footerText: { fontSize: 12, color: colors.textSecondary },
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
      ...cardShadow(colors),
    },
    cardIcon: { fontSize: 32, marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 20,
      lineHeight: 18,
    },
    cardDangerButton: {
      width: '100%',
      backgroundColor: colors.danger,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 10,
    },
    cardDangerButtonText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
    cardCancelButton: { paddingVertical: 8 },
    cardCancelButtonText: { color: colors.textSecondary, fontWeight: '700', fontSize: 14 },
  });
}
