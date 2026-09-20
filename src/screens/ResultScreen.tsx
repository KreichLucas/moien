import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { PremiumDiamondRow } from '../components/PremiumDiamondRow';
import { ProgressBar } from '../components/ProgressBar';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProgress } from '../state/ProgressContext';
import { useAnimatedNumber } from '../utils/useAnimatedNumber';
import { useAutoFitScale } from '../utils/useAutoFitScale';
import { authColors, fontFamilies, liftStyle } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

// Shared with the lesson screen's own auto-fit width, so both screens in
// the same flow feel like one consistent-sized experience.
const CONTENT_WIDTH = 700;

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ResultScreen({ route, navigation }: Props) {
  const { xpEarned, correctCount, totalCount, elapsedSeconds, lives, unitTitle, lessonTitle } = route.params;
  const { user, signOutUser } = useAuth();
  const { progress } = useProgress();
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;
  const contentWidth = Math.min(CONTENT_WIDTH, width - 40);
  const styles = useMemo(() => makeStyles(), []);
  const { onStageLayout, onNaturalLayout, scale } = useAutoFitScale();
  const animatedXp = useAnimatedNumber(xpEarned, 900, { animateFrom: 0 });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initials = (displayName.match(/\S+/g) ?? [])
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'U';

  // Lesson titles look like "Barra 1 · Introdução" — only the "Barra N" part
  // reads naturally in "Você completou a Barra 1 de Saudações."
  const barLabel = lessonTitle?.split(' · ')[0] ?? lessonTitle ?? 'esta lição';

  const handleContinue = () => navigation.popToTop();

  return (
    <View style={styles.page}>
      <LinearGradient colors={['#0A1B3F', '#123B8F', '#1450D6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient} />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.stage} onLayout={onStageLayout}>
      <View onLayout={onNaturalLayout}>
      <View style={[styles.scaleContent, { transform: [{ scale }] }]}>
      <View style={[styles.header, { width: contentWidth }]}>
        <View style={styles.topRow}>
          <View>
            {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
            <Image source={require('../../assets/moien-logo-3d.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Aprenda Luxemburguês{'\n'}de um jeito real</Text>
          </View>

          <View style={styles.topRightRow}>
            <View style={styles.streakPill}>
              <Text style={styles.streakValue}>🔥 {progress.streak}</Text>
              <Text style={styles.streakLabel}>dias seguidos</Text>
            </View>

            <View style={styles.profilePillWrap}>
              <Pressable
                style={({ pressed }) => [styles.profilePill, liftStyle(hoveredId === 'profilePill', 999, pressed)]}
                onPress={() => setProfileMenuOpen((o) => !o)}
                onHoverIn={() => setHoveredId('profilePill')}
                onHoverOut={() => setHoveredId((id) => (id === 'profilePill' ? null : id))}
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>{initials}</Text>
                </View>
                <Text style={styles.profilePillName}>Olá, {displayName}!</Text>
                <Ionicons name={profileMenuOpen ? 'chevron-up' : 'chevron-down'} size={14} color={authColors.textSecondary} />
              </Pressable>
              {profileMenuOpen && (
                <View style={styles.profileMenu}>
                  <Pressable
                    style={({ pressed }) => [styles.profileMenuItem, liftStyle(hoveredId === 'menu-perfil', 10, pressed)]}
                    onPress={() => {
                      setProfileMenuOpen(false);
                      navigation.navigate('Main', { screen: 'Profile' });
                    }}
                    onHoverIn={() => setHoveredId('menu-perfil')}
                    onHoverOut={() => setHoveredId((id) => (id === 'menu-perfil' ? null : id))}
                  >
                    <Text style={styles.profileMenuItemText}>Perfil</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.profileMenuItem, liftStyle(hoveredId === 'menu-sair', 10, pressed)]}
                    onPress={() => {
                      setProfileMenuOpen(false);
                      signOutUser();
                    }}
                    onHoverIn={() => setHoveredId('menu-sair')}
                    onHoverOut={() => setHoveredId((id) => (id === 'menu-sair' ? null : id))}
                  >
                    <Text style={[styles.profileMenuItemText, styles.profileMenuDanger]}>Sair</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.bottomRow, isNarrow && styles.bottomRowNarrow]}>
          <Pressable
            onPress={handleContinue}
            onHoverIn={() => setHoveredId('backLink')}
            onHoverOut={() => setHoveredId((id) => (id === 'backLink' ? null : id))}
            style={({ pressed }) => [styles.backLink, liftStyle(hoveredId === 'backLink', 10, pressed)]}
          >
            <Ionicons name="arrow-back" size={16} color={authColors.textPrimary} />
            <Text style={styles.backLinkText}>Voltar ao módulo</Text>
          </Pressable>

          <View style={[styles.centerColumn, isNarrow && styles.centerColumnNarrow]}>
            {unitTitle && (
              <View style={styles.breadcrumb}>
                <Text style={styles.breadcrumbUnit}>{unitTitle}</Text>
                <Text style={styles.breadcrumbSeparator}>•</Text>
                <Text style={styles.breadcrumbLesson}>{lessonTitle}</Text>
              </View>
            )}
            <ProgressBar current={totalCount} total={totalCount} />
            <Text style={styles.exerciseCounter}>
              {totalCount} de {totalCount}
            </Text>
          </View>

          {/* `gap` on `bottomRowNarrow` alone left `centerColumn` and this row
              touching (its own height under-reports vs. its rendered content
              once stacked in a column) — a hard spacer guarantees a real gap
              no matter what that measurement does. */}
          {isNarrow && <View style={styles.narrowRowSpacer} />}

          <View style={styles.rightRow}>
            <PremiumDiamondRow lives={lives} />
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              onHoverIn={() => setHoveredId('settings')}
              onHoverOut={() => setHoveredId((id) => (id === 'settings' ? null : id))}
              style={({ pressed }) => [styles.settingsButton, liftStyle(hoveredId === 'settings', 12, pressed)]}
            >
              <Ionicons name="settings-outline" size={16} color={authColors.textPrimary} />
              <Text style={styles.settingsText}>Configurações</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.card, { width: contentWidth }]}>
          <View style={styles.checkBadgeWrap}>
            {Array.from({ length: 8 }, (_, i) => (
              <View key={i} style={[styles.rayPivot, { transform: [{ rotate: `${i * 45}deg` }] }]}>
                <View style={styles.ray} />
              </View>
            ))}
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.title}>Lição concluída!</Text>
          <Text style={styles.subtitle}>
            Muito bem! Você completou a {barLabel} de {unitTitle ?? 'Moien'}.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>⭐ +{animatedXp}</Text>
              <Text style={styles.statLabel}>XP ganho</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                🎯 {correctCount}/{totalCount}
              </Text>
              <Text style={styles.statLabel}>Acertos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>⏱️ {formatDuration(elapsedSeconds)}</Text>
              <Text style={styles.statLabel}>Tempo da lição</Text>
            </View>
          </View>

          <View style={styles.messageBox}>
            <Ionicons name="stats-chart" size={20} color={authColors.accentCyan} />
            <View style={styles.messageTextWrap}>
              <Text style={styles.messageTitle}>Você está progredindo!</Text>
              <Text style={styles.messageSubtitle}>Continue assim para dominar o Luxemburguês!</Text>
            </View>
          </View>

          <Pressable
            onPress={handleContinue}
            onHoverIn={() => setHoveredId('continue')}
            onHoverOut={() => setHoveredId((id) => (id === 'continue' ? null : id))}
            style={({ pressed }) => [liftStyle(hoveredId === 'continue', 16, pressed)]}
          >
            <LinearGradient
              colors={[authColors.accentCyan, authColors.accentBlue]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>

      <Pressable
        onPress={handleContinue}
        onHoverIn={() => setHoveredId('backBottom')}
        onHoverOut={() => setHoveredId((id) => (id === 'backBottom' ? null : id))}
        style={({ pressed }) => [styles.backBottomLink, liftStyle(hoveredId === 'backBottom', 10, pressed)]}
      >
        <Text style={styles.backBottomLinkText}>Voltar para o módulo</Text>
      </Pressable>
      </View>
      </View>
      </View>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: { flex: 1, minHeight: '100%', overflow: 'hidden' },
    gradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    blob: { position: 'absolute', borderRadius: 9999, opacity: 0.35 },
    blobTop: { width: 520, height: 520, top: -220, left: -160, backgroundColor: 'rgba(56, 189, 248, 0.25)' },
    blobBottom: { width: 620, height: 620, bottom: -260, right: -220, backgroundColor: 'rgba(20, 80, 214, 0.4)' },

    // Fills the viewport and centers whatever's inside — the auto-fit
    // scale transform (`useAutoFitScale`) lives on the child measured
    // against this box's own size, same technique as the lesson screen.
    stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    scaleContent: { alignItems: 'center', gap: 18 },
    header: {
      paddingTop: 4,
      paddingBottom: 16,
      gap: 16,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
    logo: { width: 140, height: 46 },
    tagline: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 15 },
    topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakPill: {
      alignItems: 'center',
      backgroundColor: 'rgba(13, 25, 48, 0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    streakValue: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: '#FFFFFF' },
    streakLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    profilePillWrap: { position: 'relative' },
    profilePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(13, 25, 48, 0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 10,
      paddingRight: 14,
    },
    profileAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: authColors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileAvatarText: { color: '#FFFFFF', fontFamily: fontFamilies.displayBold, fontSize: 12 },
    profilePillName: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: '#FFFFFF' },
    profileMenu: {
      position: 'absolute',
      top: 48,
      right: 0,
      width: 160,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 14,
      paddingVertical: 6,
      zIndex: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
    profileMenuItem: { paddingVertical: 10, paddingHorizontal: 16 },
    profileMenuItemText: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textPrimary },
    profileMenuDanger: { color: authColors.danger },

    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
    // Below the breakpoint, a wrapped flex-row's second line can overlap
    // whatever comes after it in RN Web — stacking into a column instead
    // gives every block its own row so the header's total height is always
    // correct and the card below never overlaps it.
    bottomRowNarrow: { flexDirection: 'column', alignItems: 'center', gap: 20 },
    backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
    backLinkText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: '#FFFFFF' },
    centerColumn: { flex: 1, minWidth: 200, alignItems: 'center', gap: 6 },
    centerColumnNarrow: { flex: 0, width: '100%' },
    narrowRowSpacer: { height: 16 },
    breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    breadcrumbUnit: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: '#FFFFFF' },
    breadcrumbSeparator: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
    breadcrumbLesson: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: 'rgba(255,255,255,0.75)' },
    exerciseCounter: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(13, 25, 48, 0.55)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    settingsText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: '#FFFFFF' },

    card: {
      backgroundColor: 'rgba(10, 24, 56, 0.6)',
      borderWidth: 1,
      borderColor: 'rgba(148, 197, 255, 0.35)',
      borderRadius: 32,
      paddingVertical: 36,
      paddingHorizontal: 36,
      alignItems: 'center',
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.25,
      shadowRadius: 50,
      elevation: 12,
    },
    checkBadgeWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    // Each pivot spans the full badge box so rotating it turns around the
    // badge's own center (like a clock hand) — the visible spark is just
    // anchored to the pivot's top edge, offset a bit further out with a
    // negative margin so it radiates past the circle instead of touching it.
    rayPivot: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
    ray: {
      width: 4,
      height: 14,
      borderRadius: 2,
      marginTop: -6,
      backgroundColor: 'rgba(148, 197, 255, 0.7)',
    },
    checkBadge: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: authColors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 24,
      elevation: 10,
    },
    title: { fontFamily: fontFamilies.displayExtraBold, fontSize: 30, color: '#FFFFFF', textAlign: 'center' },
    subtitle: {
      fontFamily: fontFamilies.displayRegular,
      fontSize: 15,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    statsRow: { flexDirection: 'row', gap: 14, width: '100%' },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(13, 25, 48, 0.6)',
      borderWidth: 1,
      borderColor: 'rgba(148, 197, 255, 0.25)',
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    statValue: { fontFamily: fontFamilies.displayBold, fontSize: 17, color: '#FFFFFF' },
    statLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
    messageBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
      borderRadius: 16,
      padding: 16,
      marginTop: 16,
      marginBottom: 24,
    },
    messageTextWrap: { flex: 1 },
    messageTitle: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: '#FFFFFF' },
    messageSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 48,
    },
    continueButtonText: { color: '#FFFFFF', fontFamily: fontFamilies.displayBold, fontSize: 16, letterSpacing: 0.4 },
    backBottomLink: { paddingVertical: 8, paddingHorizontal: 12 },
    backBottomLinkText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  });
}
