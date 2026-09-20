import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';
import { LEVEL_LABELS, splitLevelLabel } from '../content/levels';
import { ModuleCatalogEntry, MODULE_CATALOG_A1 } from '../content/moduleCatalogA1';
import { getNextLessonForUnit } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProgress } from '../state/ProgressContext';
import { CEFRLevel, CEFR_LEVELS } from '../types/content';
import { authColors, fontFamilies, liftStyle } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'AllModules'>;

const GRID_GAP = 16;

/** A1-INICIANTE is the only level with its own hand-authored 20-module catalog (below) — every other level's tab is built straight from real `Unit` data at that level, so no level is ever hardcoded away. */
const CATALOG_LEVEL: CEFRLevel = 'A1-INICIANTE';

export function AllModulesScreen({ navigation }: Props) {
  const { user, signOutUser } = useAuth();
  const { progress } = useProgress();
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;
  const styles = useMemo(() => makeStyles(), []);
  // Fixed per-card width instead of flexGrow: with flexGrow, a last row
  // that ends up with fewer cards than the rows above it (e.g. only 2 of
  // the 20 modules left over) stretches those leftover cards to fill the
  // whole row, making them visibly bigger than every other card. A fixed
  // width computed from the actual column count never stretches, so every
  // card — including a lone one on the last row — stays the same size.
  const gridColumns = width >= 1300 ? 4 : width >= 1000 ? 3 : width >= 680 ? 2 : 1;
  const gridContentWidth = Math.min(width, 1600) - 28 * 2;
  const cardWidth = (gridContentWidth - GRID_GAP * (gridColumns - 1)) / gridColumns;
  const [activeTab, setActiveTab] = useState<CEFRLevel>(CATALOG_LEVEL);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initials = (displayName.match(/\S+/g) ?? [])
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'U';

  const moduleStats = useMemo(() => {
    return MODULE_CATALOG_A1.map((entry) => {
      const unit = entry.unitId ? units.find((u) => u.id === entry.unitId) : undefined;
      const completedLessons = unit ? unit.lessons.filter((l) => progress.completedLessonIds.includes(l.id)).length : 0;
      const totalLessons = unit ? unit.lessons.length : 5;
      const isComplete = !!unit && completedLessons === totalLessons;
      return { entry, unit, completedLessons, totalLessons, isComplete };
    });
  }, [progress.completedLessonIds]);

  const completedModuleCount = moduleStats.filter((m) => m.isComplete).length;
  const totalModuleCount = MODULE_CATALOG_A1.length;
  const levelPct = Math.round((completedModuleCount / totalModuleCount) * 100);

  // Every level other than CATALOG_LEVEL has no hand-authored catalog entry
  // (order/icon) — built straight from real `Unit` data at that level
  // instead, so a level with real content (today: A2/B1/B2's "Iniciante"
  // stage) shows its real modules rather than a permanent "Em breve".
  const realLevelStats = useMemo(() => {
    return units
      .filter((u) => u.level === activeTab)
      .map((unit, i) => {
        const completedLessons = unit.lessons.filter((l) => progress.completedLessonIds.includes(l.id)).length;
        const totalLessons = unit.lessons.length;
        const entry: ModuleCatalogEntry = { order: i + 1, title: unit.title, icon: 'book' };
        return { entry, unit, completedLessons, totalLessons, isComplete: totalLessons > 0 && completedLessons === totalLessons };
      });
  }, [activeTab, progress.completedLessonIds]);
  const realCompletedModuleCount = realLevelStats.filter((m) => m.isComplete).length;
  const realTotalModuleCount = realLevelStats.length;
  const realLevelPct = realTotalModuleCount > 0 ? Math.round((realCompletedModuleCount / realTotalModuleCount) * 100) : 0;
  const [activeTabCode, activeTabStage] = splitLevelLabel(activeTab);

  const handleModulePress = (unit: (typeof units)[number]) => {
    const lesson = getNextLessonForUnit(unit, progress.completedLessonIds);
    navigation.navigate('Lesson', { lessonId: lesson.id });
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentInner}>
        <View style={styles.header}>
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
                  <UserAvatar style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>{initials}</Text>
                  </UserAvatar>
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

          <View style={[styles.titleRow, isNarrow && styles.titleRowNarrow]}>
            <Pressable
              onPress={() => navigation.navigate('Main', { screen: 'Home' })}
              onHoverIn={() => setHoveredId('backLink')}
              onHoverOut={() => setHoveredId((id) => (id === 'backLink' ? null : id))}
              style={({ pressed }) => [styles.backLink, liftStyle(hoveredId === 'backLink', 10, pressed)]}
            >
              <Ionicons name="chevron-back" size={16} color={authColors.textPrimary} />
              <Text style={styles.backLinkText}>Voltar ao início</Text>
            </Pressable>

            <View style={styles.titleCenter}>
              <Text style={styles.pageTitle}>Todos os módulos</Text>
              <Text style={styles.pageSubtitle}>Escolha um módulo e continue sua jornada no Luxemburguês!</Text>
            </View>

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

        <View style={styles.levelTabBar}>
          {CEFR_LEVELS.map((level) => {
            const isActive = level === activeTab;
            return (
              <Pressable
                key={level}
                onPress={() => setActiveTab(level)}
                onHoverIn={() => setHoveredId(`tab-${level}`)}
                onHoverOut={() => setHoveredId((id) => (id === `tab-${level}` ? null : id))}
                style={({ pressed }) => [liftStyle(hoveredId === `tab-${level}` && !isActive, 999, pressed)]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[authColors.accentCyan, authColors.accentBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.levelTab}
                  >
                    <Text style={styles.levelTabTextActive}>{LEVEL_LABELS[level]}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.levelTab}>
                    <Text style={styles.levelTabText}>{LEVEL_LABELS[level]}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {activeTab === CATALOG_LEVEL ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeaderRow, isNarrow && styles.sectionHeaderRowNarrow]}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>A1 - Iniciante</Text>
                <Text style={styles.sectionSubtitle}>Comece sua jornada aprendendo o essencial para o dia a dia.</Text>
              </View>
              <View style={styles.sectionProgressBlock}>
                <Text style={styles.sectionProgressLabel}>
                  {completedModuleCount} de {totalModuleCount} módulos concluídos
                </Text>
                <View style={styles.sectionProgressRow}>
                  <View style={styles.sectionProgressTrack}>
                    <View style={[styles.sectionProgressFill, { width: `${levelPct}%` }]} />
                  </View>
                  <Text style={styles.sectionProgressPct}>{levelPct}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              {moduleStats.map(({ entry, unit, completedLessons, totalLessons, isComplete }) => (
                <ModuleCard
                  key={entry.order}
                  entry={entry}
                  completedLessons={completedLessons}
                  totalLessons={totalLessons}
                  isComplete={isComplete}
                  isHovered={hoveredId === `module-${entry.order}`}
                  onHoverIn={() => setHoveredId(`module-${entry.order}`)}
                  onHoverOut={() => setHoveredId((id) => (id === `module-${entry.order}` ? null : id))}
                  onPress={unit ? () => handleModulePress(unit) : undefined}
                  styles={styles}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          </View>
        ) : realLevelStats.length > 0 ? (
          <View style={styles.section}>
            <View style={[styles.sectionHeaderRow, isNarrow && styles.sectionHeaderRowNarrow]}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  {activeTabCode} - {activeTabStage}
                </Text>
                <Text style={styles.sectionSubtitle}>Continue avançando no seu aprendizado de luxemburguês.</Text>
              </View>
              <View style={styles.sectionProgressBlock}>
                <Text style={styles.sectionProgressLabel}>
                  {realCompletedModuleCount} de {realTotalModuleCount} módulos concluídos
                </Text>
                <View style={styles.sectionProgressRow}>
                  <View style={styles.sectionProgressTrack}>
                    <View style={[styles.sectionProgressFill, { width: `${realLevelPct}%` }]} />
                  </View>
                  <Text style={styles.sectionProgressPct}>{realLevelPct}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.grid}>
              {realLevelStats.map(({ entry, unit, completedLessons, totalLessons, isComplete }) => (
                <ModuleCard
                  key={unit.id}
                  entry={entry}
                  completedLessons={completedLessons}
                  totalLessons={totalLessons}
                  isComplete={isComplete}
                  isHovered={hoveredId === `module-${unit.id}`}
                  onHoverIn={() => setHoveredId(`module-${unit.id}`)}
                  onHoverOut={() => setHoveredId((id) => (id === `module-${unit.id}` ? null : id))}
                  onPress={() => handleModulePress(unit)}
                  styles={styles}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="hourglass-outline" size={32} color={authColors.textSecondary} />
            <Text style={styles.emptyTitle}>Em breve!</Text>
            <Text style={styles.emptySubtitle}>Novos módulos chegando em breve para {LEVEL_LABELS[activeTab]}.</Text>
          </View>
        )}
        </View>
      </ScrollView>
    </View>
  );
}

function ModuleCard({
  entry,
  completedLessons,
  totalLessons,
  isComplete,
  isHovered,
  onHoverIn,
  onHoverOut,
  onPress,
  styles,
  cardWidth,
}: {
  entry: ModuleCatalogEntry;
  completedLessons: number;
  totalLessons: number;
  isComplete: boolean;
  isHovered: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onPress?: () => void;
  styles: ReturnType<typeof makeStyles>;
  cardWidth: number;
}) {
  const isLocked = !onPress;
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <Pressable
      disabled={isLocked}
      onPress={onPress}
      onHoverIn={isLocked ? undefined : onHoverIn}
      onHoverOut={isLocked ? undefined : onHoverOut}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        isComplete && styles.cardComplete,
        isLocked && styles.cardLocked,
        !isLocked && liftStyle(isHovered, 20, pressed),
      ]}
    >
      <View style={[styles.cardIconBadge, isComplete && styles.cardIconBadgeComplete, isLocked && styles.cardIconBadgeLocked]}>
        <Ionicons name={entry.icon} size={24} color={isComplete ? '#22C55E' : isLocked ? authColors.textMuted : authColors.accentCyan} />
      </View>
      <View style={styles.cardTextBlock}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {entry.order}. {entry.title}
        </Text>
        <Text style={styles.cardSubtitle}>
          {completedLessons} de {totalLessons} lições
        </Text>
        <View style={styles.cardProgressTrack}>
          <View style={[styles.cardProgressFill, { width: `${pct}%` }]} />
        </View>
        {isLocked && <Text style={styles.cardSoonBadge}>Em breve</Text>}
      </View>
      {isLocked ? (
        <Ionicons name="lock-closed" size={16} color={authColors.textMuted} />
      ) : isComplete ? (
        <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={authColors.accentCyan} />
      )}
    </Pressable>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg },
    scrollContent: { paddingBottom: 60, alignItems: 'center' },
    // Caps how wide the grid can stretch on very large/ultra-wide screens —
    // below this width it's just 100% wide (no visual change from before),
    // above it the whole section centers with even margins instead of the
    // cards clumping to the left with empty space on the right.
    contentInner: { width: '100%', maxWidth: 1600 },

    header: { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 8, gap: 20 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
    logo: { width: 140, height: 46 },
    tagline: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: authColors.textSecondary, marginTop: 4, lineHeight: 15 },
    topRightRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakPill: {
      alignItems: 'center',
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 14,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    streakValue: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: authColors.textPrimary },
    streakLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 10, color: authColors.textSecondary, marginTop: 2 },
    profilePillWrap: { position: 'relative' },
    profilePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
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
    profilePillName: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.textPrimary },
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

    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    titleRowNarrow: { flexDirection: 'column', gap: 14 },
    backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: authColors.cardBorder, borderRadius: 999 },
    backLinkText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textPrimary },
    titleCenter: { flex: 1, alignItems: 'center', minWidth: 200 },
    pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 32, color: authColors.textPrimary, textAlign: 'center' },
    pageSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary, marginTop: 6, textAlign: 'center' },
    settingsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 12,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    settingsText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.textPrimary },

    levelTabBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 999,
      padding: 6,
      marginHorizontal: 28,
      marginTop: 12,
      marginBottom: 28,
    },
    levelTab: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 999 },
    levelTabText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textSecondary },
    levelTabTextActive: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: '#FFFFFF' },

    section: { paddingHorizontal: 28, marginBottom: 28 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 20 },
    sectionHeaderRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
    sectionHeaderText: { flex: 1, minWidth: 220 },
    sectionTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 22, color: authColors.textPrimary },
    sectionSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.accentCyan, marginTop: 4 },
    sectionProgressBlock: { minWidth: 220, alignItems: 'flex-end' },
    sectionProgressLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary, marginBottom: 8 },
    sectionProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
    sectionProgressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: authColors.inputBg, overflow: 'hidden' },
    sectionProgressFill: { height: '100%', borderRadius: 4, backgroundColor: authColors.accentCyan },
    sectionProgressPct: { fontFamily: fontFamilies.displayBold, fontSize: 13, color: authColors.textPrimary },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
    card: {
      // Width is set inline per-card (`cardWidth`, computed from the actual
      // column count) instead of flexGrow/flexBasis — flexGrow would let a
      // short last row (e.g. only 2 modules left over) stretch those cards
      // to fill the whole row, making them bigger than every other card.
      flexGrow: 0,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 20,
      padding: 16,
    },
    cardComplete: { borderColor: '#22C55E' },
    cardLocked: { opacity: 0.55 },
    cardIconBadge: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: 'rgba(56, 189, 248, 0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconBadgeComplete: { backgroundColor: 'rgba(34, 197, 94, 0.16)' },
    cardIconBadgeLocked: { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
    cardTextBlock: { flex: 1, minWidth: 0 },
    cardTitle: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
    cardSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: authColors.textSecondary, marginTop: 4 },
    cardProgressTrack: { height: 5, borderRadius: 3, backgroundColor: authColors.inputBg, overflow: 'hidden', marginTop: 8 },
    cardProgressFill: { height: '100%', borderRadius: 3, backgroundColor: authColors.accentCyan },
    cardSoonBadge: { fontFamily: fontFamilies.displaySemiBold, fontSize: 10, color: authColors.textMuted, marginTop: 6, letterSpacing: 0.4, textTransform: 'uppercase' },

    emptySection: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 60, gap: 10 },
    emptyTitle: { fontFamily: fontFamilies.displayBold, fontSize: 18, color: authColors.textPrimary },
    emptySubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary, textAlign: 'center' },
  });
}
