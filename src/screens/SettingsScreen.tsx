import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProgress } from '../state/ProgressContext';
import { authColors, fontFamilies, liftStyle } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  // Same hooks, same functions, same behavior as before — this pass only
  // touches how they're presented (handleConfirmReset still calls the
  // exact resetProgress()/popToTop() pair; signOutUser() is still called
  // directly, untouched).
  const { resetProgress } = useProgress();
  const { user, signOutUser } = useAuth();
  const { width } = useWindowDimensions();
  const isNarrow = width < 640;
  const styles = useMemo(() => makeStyles(), []);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleConfirmReset = () => {
    resetProgress();
    setConfirmVisible(false);
    navigation.popToTop();
  };

  return (
    <View style={styles.page}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.closeButton, liftStyle(hoveredId === 'close', 20, pressed)]}
          onHoverIn={() => setHoveredId('close')}
          onHoverOut={() => setHoveredId((id) => (id === 'close' ? null : id))}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={authColors.textPrimary} />
        </Pressable>

        <View style={styles.headerRow}>
          <View style={styles.headerTextBlock}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="settings" size={14} color={authColors.accentCyan} />
              <Text style={styles.eyebrow}>Configurações</Text>
            </View>
            <Text style={styles.pageTitle}>Configurações</Text>
            <Text style={styles.pageSubtitle}>Gerencie sua conta e preferências do Moien.</Text>
          </View>
          {!isNarrow && (
            <View style={styles.headerIconWrap}>
              <Ionicons name="settings" size={64} color="rgba(56, 189, 248, 0.28)" />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={[styles.cardRow, isNarrow && styles.cardRowNarrow]}>
            <View style={styles.cardLeft}>
              <UserAvatar style={styles.avatarCircle}>
                <Ionicons name="person" size={26} color={authColors.accentCyan} />
              </UserAvatar>
              <View style={styles.cardLeftText}>
                <Text style={styles.cardLabel}>Conta</Text>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {user?.email ?? 'Usuário'}
                </Text>
                <Text style={styles.cardHint}>Sua conta está conectada.</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, liftStyle(hoveredId === 'signOut', 14, pressed)]}
              onPress={() => signOutUser()}
              onHoverIn={() => setHoveredId('signOut')}
              onHoverOut={() => setHoveredId((id) => (id === 'signOut' ? null : id))}
            >
              <Ionicons name="log-out-outline" size={16} color={authColors.textPrimary} />
              <Text style={styles.secondaryButtonText}>Sair</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardRow, isNarrow && styles.cardRowNarrow]}>
            <View style={styles.cardLeft}>
              <View style={styles.dangerIconWrap}>
                <Ionicons name="refresh" size={24} color={authColors.danger} />
              </View>
              <View style={styles.cardLeftText}>
                <Text style={styles.cardLabel}>Progresso</Text>
                <Text style={styles.cardTitle}>Resetar progresso</Text>
                <Text style={styles.cardHint}>Apaga XP, ofensiva, conquistas e lições completas neste aparelho.</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.dangerButton, liftStyle(hoveredId === 'reset', 14, pressed)]}
              onPress={() => setConfirmVisible(true)}
              onHoverIn={() => setHoveredId('reset')}
              onHoverOut={() => setHoveredId((id) => (id === 'reset' ? null : id))}
            >
              <Text style={styles.dangerButtonText}>Resetar progresso</Text>
            </Pressable>
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={18} color="#F0C94A" />
            <View style={styles.warningTextWrap}>
              <Text style={styles.warningTitle}>Atenção</Text>
              <Text style={styles.warningText}>Apaga XP, ofensiva, conquistas e lições completas neste aparelho.</Text>
            </View>
          </View>
        </View>

        <View style={[styles.footer, isNarrow && styles.footerNarrow]}>
          <Text style={styles.footerText}>Moien!  v1.0.0</Text>
          <Text style={styles.footerTagline}>Aprenda hoje. Vá mais longe. ✦</Text>
        </View>
      </ScrollView>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmVisible(false)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="warning" size={28} color={authColors.danger} />
            </View>
            <Text style={styles.confirmTitle}>Resetar todo o progresso?</Text>
            <Text style={styles.confirmSubtitle}>
              Essa ação não pode ser desfeita. Você vai perder seu XP, ofensiva, lições completas e conquistas.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.confirmDangerButton, pressed && styles.confirmButtonPressed]}
              onPress={handleConfirmReset}
            >
              <Text style={styles.confirmDangerButtonText}>SIM, RESETAR</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.confirmCancelButton, pressed && styles.confirmButtonPressed]}
              onPress={() => setConfirmVisible(false)}
            >
              <Text style={styles.confirmCancelButtonText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg, overflow: 'hidden' },
    blob: { position: 'absolute', borderRadius: 9999, opacity: 0.3 },
    blobTop: { width: 480, height: 480, top: -200, left: -160, backgroundColor: authColors.blobBlue },
    blobBottom: { width: 520, height: 520, bottom: -220, right: -180, backgroundColor: authColors.blobCyan },

    scroll: { flex: 1 },
    content: { maxWidth: 760, width: '100%', alignSelf: 'center', padding: 28, paddingTop: 24, paddingBottom: 60 },

    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.inputBorder,
      marginBottom: 20,
    },

    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
    headerTextBlock: { flex: 1 },
    eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    eyebrow: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: authColors.accentCyan,
    },
    pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 30, color: authColors.textPrimary },
    pageSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary, marginTop: 6 },
    headerIconWrap: {
      width: 96,
      height: 96,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.18)',
    },

    card: {
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 24,
      padding: 22,
      marginBottom: 20,
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
      elevation: 6,
    },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    cardRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
    // alignSelf: 'stretch' + width: '100%': harmless in the row layout
    // (flex: 1 already fills it), but load-bearing in cardRowNarrow, where
    // the parent switches to a column with alignItems: 'flex-start' — that
    // makes children size to their own content instead of the card's
    // width unless told otherwise, which let a long e-mail overflow past
    // the card's edge instead of the numberOfLines={1} on it ever kicking in.
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, alignSelf: 'stretch', width: '100%' },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: authColors.inputBg,
      borderWidth: 1.5,
      borderColor: authColors.accentCyan,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255, 122, 122, 0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 122, 122, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // minWidth: 0 overrides the flex item's default min-width: auto on web —
    // without it, a long e-mail refuses to shrink below its own content
    // width and overflows past the card's edge instead of truncating.
    cardLeftText: { flex: 1, minWidth: 0 },
    cardLabel: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 11,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: authColors.textMuted,
      marginBottom: 3,
    },
    cardTitle: { fontFamily: fontFamilies.displayBold, fontSize: 16, color: authColors.textPrimary },
    cardHint: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginTop: 4, lineHeight: 18 },

    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.inputBorder,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    secondaryButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textPrimary },

    dangerButton: {
      backgroundColor: 'rgba(255, 122, 122, 0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255, 122, 122, 0.5)',
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    dangerButtonText: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.danger },

    warningBox: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: 'rgba(240, 201, 74, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(240, 201, 74, 0.3)',
      borderRadius: 16,
      padding: 16,
      marginTop: 18,
    },
    warningTextWrap: { flex: 1 },
    warningTitle: { fontFamily: fontFamilies.displayBold, fontSize: 13, color: '#F0C94A' },
    warningText: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginTop: 3, lineHeight: 18 },

    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
    footerNarrow: { flexDirection: 'column', alignItems: 'flex-start', gap: 6 },
    footerText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12.5, color: authColors.textSecondary },
    footerTagline: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textMuted },

    backdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 16, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    confirmCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: authColors.pageBgTop,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 24,
      padding: 26,
      alignItems: 'center',
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.4,
      shadowRadius: 40,
      elevation: 12,
    },
    confirmIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 122, 122, 0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 122, 122, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    confirmTitle: { fontFamily: fontFamilies.displayBold, fontSize: 18, color: authColors.textPrimary, textAlign: 'center' },
    confirmSubtitle: {
      fontFamily: fontFamilies.displayRegular,
      fontSize: 13.5,
      color: authColors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 22,
      lineHeight: 19,
    },
    confirmButtonPressed: { opacity: 0.85 },
    confirmDangerButton: {
      width: '100%',
      backgroundColor: authColors.danger,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
      marginBottom: 10,
    },
    confirmDangerButtonText: { color: '#FFFFFF', fontFamily: fontFamilies.displayBold, fontSize: 15, letterSpacing: 0.4 },
    confirmCancelButton: { paddingVertical: 8 },
    confirmCancelButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textSecondary },
  });
}
