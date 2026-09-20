import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ModuleCatalogEntry, MODULE_CATALOG_A1 } from '../content/moduleCatalogA1';
import { getNextLessonForUnit } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProgress } from '../state/ProgressContext';
import { authColors, fontFamilies, liftStyle } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'AllModules'>;

type LevelTabId = 'A1' | 'A1+' | 'A2' | 'A2+' | 'B1' | 'B1+';

const LEVEL_TABS: { id: LevelTabId; label: string }[] = [
  { id: 'A1', label: 'A1' },
  { id: 'A1+', label: 'A1 Avançado' },
  { id: 'A2', label: 'A2' },
  { id: 'A2+', label: 'A2 Avançado' },
  { id: 'B1', label: 'B1' },
  { id: 'B1+', label: 'B1 Avançado' },
];

export function AllModulesScreen({ navigation }: Props) {
  const { user, signOutUser } = useAuth();
  const { progress } = useProgress();
  const { width } = useWindowDimensions();
  const isNarrow = width < 720;
  const styles = useMemo(() => makeStyles(), []);
  const [activeTab, setActiveTab] = useState<LevelTabId>('A1');
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

  const handleModulePress = (unit: (typeof units)[number]) => {
    const lesson = getNextLessonForUnit(unit, progress.completedLessonIds);
    navigation.navigate('Lesson', { lessonId: lesson.id });
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          {LEVEL_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                onHoverIn={() => setHoveredId(`tab-${tab.id}`)}
                onHoverOut={() => setHoveredId((id) => (id === `tab-${tab.id}` ? null : id))}
                style={({ pressed }) => [liftStyle(hoveredId === `tab-${tab.id}` && !isActive, 999, pressed)]}
              >
                {isActive ? (
                  <LinearGradient
                    colors={[authColors.accentCyan, authColors.accentBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.levelTab}
                  >
                    <Text style={styles.levelTabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.levelTab}>
                    <Text style={styles.levelTabText}>{tab.label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'A1' ? (
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
                />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Ionicons name="hourglass-outline" size={32} color={authColors.textSecondary} />
            <Text style={styles.emptyTitle}>Em breve!</Text>
            <Text style={styles.emptySubtitle}>Novos módulos chegando em breve para {LEVEL_TABS.find((t) => t.id === activeTab)?.label}.</Text>
          </View>
        )}
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
        isComplete && styles.cardComplete,
        isLocked && styles.cardLocked,
        !isLocked && liftStyle(isHovered, 20, pressed),
      ]}
    >
      <View style={[styles.cardIconBadge, isComplete && styles.cardIconBadgeComplete]}>
        <Text style={styles.cardIconText}>{entry.icon}</Text>
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
    scrollContent: { paddingBottom: 60 },

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

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    card: {
      flexGrow: 1,
      // Tuned so exactly 4 fit per row at typical desktop widths (matching
      // the reference), instead of shrinking to fit a 5th.
      flexBasis: 300,
      maxWidth: 360,
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
    cardIconText: { fontSize: 22 },
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
