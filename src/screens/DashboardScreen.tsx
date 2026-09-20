import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { ImageBackground, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { UserAvatar } from '../components/UserAvatar';
import { getPhraseOfTheDay } from '../content/dailyPhrases';
import { LEVEL_LABELS, getLevelProgress, nextLevel, splitLevelLabel } from '../content/levels';
import { getNextLessonForUnit } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProgress } from '../state/ProgressContext';
import { CEFR_LEVELS } from '../types/content';
import { useHoverGuard } from '../utils/useHoverGuard';
import { authColors, liftStyle, makeDashboardStyles } from './dashboardStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Modern vector icons for the module carousel, keyed by unit id — kept local
 * to the dashboard rather than touching `unit.icon` (still plain emoji),
 * since the old trail/ObjectiveScreen render that field as-is and are out of
 * scope for this redesign.
 */
const MODULE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'a1-obj1': 'chatbubbles',
  'a1-obj2': 'chatbubble-ellipses',
  'a1-obj3': 'calculator',
  'a1-obj4': 'color-palette',
  u3: 'people',
  u4: 'restaurant',
};
const DEFAULT_MODULE_ICON: keyof typeof Ionicons.glyphMap = 'book';

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const { user, signOutUser } = useAuth();
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;
  const styles = useMemo(() => makeDashboardStyles(), []);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isHoverReady = useHoverGuard();
  const onHoverIn = (id: string) => () => isHoverReady() && setHoveredId(id);
  const onHoverOut = (id: string) => () => setHoveredId((current) => (current === id ? null : current));

  const levelProgress = getLevelProgress(units, progress.completedLessonIds);
  const levelPct =
    levelProgress.total > 0 ? Math.min(100, Math.round((levelProgress.completed / levelProgress.total) * 100)) : 0;
  const [levelGroupCode, levelStageName] = splitLevelLabel(levelProgress.level);
  const levelAhead = nextLevel(levelProgress.level);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initials = (displayName.match(/\S+/g) ?? [])
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || 'U';

  const a1Units = useMemo(() => units.filter((u) => u.level === 'A1-INICIANTE'), []);
  const modules = useMemo(
    () =>
      a1Units.map((u) => {
        const completed = u.lessons.filter((l) => progress.completedLessonIds.includes(l.id)).length;
        return {
          id: u.id,
          title: u.title,
          icon: MODULE_ICONS[u.id] ?? DEFAULT_MODULE_ICON,
          completed,
          total: u.lessons.length,
        };
      }),
    [a1Units, progress.completedLessonIds]
  );
  const activeModuleIndex = modules.findIndex((m) => m.completed < m.total);

  const currentLevelIndex = CEFR_LEVELS.indexOf(levelProgress.level);

  const phrase = useMemo(() => getPhraseOfTheDay(), []);
  const handlePlayPhrase = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.lu);
      utterance.lang = 'lb-LU';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const goToLearn = () => navigation.navigate('Learn');

  return (
    <View style={styles.contentArea}>
      <ScrollView contentContainerStyle={styles.contentScroll}>
        <View style={styles.topBar}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={18} color={authColors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar lições, palavras ou temas..."
              placeholderTextColor={authColors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={[styles.statsRow, isNarrow && styles.statsRowNarrow]}>
            <Pressable
              onPress={() => navigation.navigate('Streak')}
              onHoverIn={onHoverIn('streakPill')}
              onHoverOut={onHoverOut('streakPill')}
              style={({ pressed }) => [styles.statPill, liftStyle(hoveredId === 'streakPill', 14, pressed)]}
            >
              <Text style={styles.statPillValue}>🔥 {progress.streak}</Text>
              <Text style={styles.statPillLabel}>dias seguidos</Text>
            </Pressable>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>⭐ {progress.xp}</Text>
              <Text style={styles.statPillLabel}>XP total</Text>
            </View>

            <View style={styles.profilePillWrap}>
              <Pressable
                style={({ pressed }) => [styles.profilePill, liftStyle(hoveredId === 'profilePill', 999, pressed)]}
                onPress={() => setProfileMenuOpen((o) => !o)}
                onHoverIn={onHoverIn('profilePill')}
                onHoverOut={onHoverOut('profilePill')}
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
                    onHoverIn={onHoverIn('menu-perfil')}
                    onHoverOut={onHoverOut('menu-perfil')}
                  >
                    <Text style={styles.profileMenuItemText}>Perfil</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.profileMenuItem, liftStyle(hoveredId === 'menu-config', 10, pressed)]}
                    onPress={() => {
                      setProfileMenuOpen(false);
                      navigation.navigate('Settings');
                    }}
                    onHoverIn={onHoverIn('menu-config')}
                    onHoverOut={onHoverOut('menu-config')}
                  >
                    <Text style={styles.profileMenuItemText}>Configurações</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.profileMenuItem, liftStyle(hoveredId === 'menu-sair', 10, pressed)]}
                    onPress={() => {
                      setProfileMenuOpen(false);
                      signOutUser();
                    }}
                    onHoverIn={onHoverIn('menu-sair')}
                    onHoverOut={onHoverOut('menu-sair')}
                  >
                    <Text style={[styles.profileMenuItemText, styles.profileMenuDanger]}>Sair</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.heroRow, isNarrow && styles.heroRowNarrow]}>
          <ImageBackground
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={require('../../assets/WhatsApp Image 2026-09-19 at 21.25.06.jpeg')}
            style={[styles.hero, isNarrow && styles.heroNarrow]}
            imageStyle={{ borderRadius: 28 }}
          >
            <LinearGradient
              colors={['rgba(4,11,24,0.35)', 'rgba(4,11,24,0.92)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.heroOverlay}
            />
            <View style={[styles.heroContent, isNarrow && styles.heroContentNarrow]}>
              <View style={styles.heroTag}>
                <Text style={styles.heroTagText}>{LEVEL_LABELS[levelProgress.level]}</Text>
              </View>
              <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]} numberOfLines={2}>
                Olá, {displayName}! 👋
              </Text>
              <Text style={styles.heroSubtitle}>Vamos aprender hoje?</Text>
              {!isNarrow && (
                <View style={styles.heroPhraseBlock}>
                  <Text style={styles.heroPhraseLabel}>☀️ Frase do dia</Text>
                  <Text style={styles.heroQuote}>"{phrase.lu}"</Text>
                  <Text style={styles.heroQuoteAttribution}>{phrase.pt}</Text>
                  <Pressable
                    onPress={handlePlayPhrase}
                    onHoverIn={onHoverIn('audio')}
                    onHoverOut={onHoverOut('audio')}
                    style={({ pressed }) => [styles.heroPhraseAudioRow, liftStyle(hoveredId === 'audio', 10, pressed)]}
                    hitSlop={6}
                  >
                    <Ionicons name="volume-high" size={15} color={authColors.accentCyan} />
                    <Text style={styles.heroPhraseAudioText}>Ouvir</Text>
                  </Pressable>
                </View>
              )}
              <View style={styles.heroButtonWrap}>
                <Pressable
                  onPress={goToLearn}
                  onHoverIn={onHoverIn('heroButton')}
                  onHoverOut={onHoverOut('heroButton')}
                  style={({ pressed }) => [
                    { alignSelf: 'flex-start' },
                    liftStyle(hoveredId === 'heroButton', 16, pressed),
                  ]}
                >
                  <LinearGradient
                    colors={[authColors.accentCyan, authColors.accentBlue]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroButton}
                  >
                    <Text style={styles.heroButtonText}>Continuar aprendendo</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
            <View style={styles.heroCorner}>
              <Text style={styles.heroCornerText}>Lëtzebuerg</Text>
              <Text style={styles.heroCornerText}>Lieft an dir! 💙</Text>
            </View>
          </ImageBackground>

          <View style={[styles.progressCard, isNarrow && styles.progressCardNarrow]}>
            <View>
              <Text style={styles.progressTitle}>Seu progresso</Text>
              <View style={styles.progressLevelRow}>
                <View style={styles.progressLevelBadge}>
                  <Text style={styles.progressLevelBadgeText}>{levelGroupCode}</Text>
                </View>
                <View>
                  <Text style={styles.progressLevelStage}>{levelStageName}</Text>
                  <Text style={styles.progressLevelLabel}>Nível atual</Text>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${levelPct}%` }]} />
              </View>
              <Text style={styles.progressBarLabel}>
                {levelPct}% · {levelProgress.completed} de {levelProgress.total} lições concluídas
              </Text>
              {levelAhead && <Text style={styles.progressNextLevel}>Próximo: {LEVEL_LABELS[levelAhead]}</Text>}
            </View>
            <View style={styles.progressQuoteBox}>
              <Text style={styles.progressQuoteText}>"Kleng Schrëtt féieren och zum Ziel."</Text>
              <Text style={styles.progressQuoteAttribution}>— Provérbio luxemburguês</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Continue aprendendo</Text>
            <Pressable
              onPress={() => navigation.navigate('AllModules')}
              onHoverIn={onHoverIn('verTodos')}
              onHoverOut={onHoverOut('verTodos')}
              style={({ pressed }) => liftStyle(hoveredId === 'verTodos', 8, pressed)}
            >
              <Text style={styles.sectionLink}>Ver todos os módulos →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleCarousel}>
            {modules.map((m, i) => {
              const isActive = i === activeModuleIndex;
              const label = isActive ? 'Continuar' : m.completed === 0 ? 'Começar' : 'Praticar';
              const pct = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => {
                    const unit = units.find((u) => u.id === m.id)!;
                    const lesson = getNextLessonForUnit(unit, progress.completedLessonIds);
                    navigation.navigate('Lesson', { lessonId: lesson.id });
                  }}
                  onHoverIn={onHoverIn(`module-${m.id}`)}
                  onHoverOut={onHoverOut(`module-${m.id}`)}
                  style={({ pressed }) => [
                    styles.moduleCard,
                    isActive && styles.moduleCardActive,
                    liftStyle(hoveredId === `module-${m.id}`, 20, pressed),
                  ]}
                >
                  <View style={[styles.moduleIconBadge, isActive && styles.moduleIconBadgeActive]}>
                    <Ionicons name={m.icon} size={24} color={isActive ? '#FFFFFF' : authColors.accentCyan} />
                  </View>
                  <Text style={styles.moduleTitle}>{m.title}</Text>
                  <View style={styles.moduleProgressTrack}>
                    <View style={[styles.moduleProgressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.moduleCount}>
                    {m.completed} de {m.total} lições
                  </Text>
                  <View style={[styles.moduleButton, isActive ? styles.moduleButtonActive : styles.moduleButtonInactive]}>
                    <Text style={[styles.moduleButtonText, isActive ? styles.moduleButtonTextActive : styles.moduleButtonTextInactive]}>
                      {label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>Sua jornada no Luxemburguês</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.journeyScroll}>
            <View style={styles.journeyRow}>
              {CEFR_LEVELS.map((level, i) => {
                const [code, desc] = LEVEL_LABELS[level].split(' · ');
                const status = i < currentLevelIndex ? 'done' : i === currentLevelIndex ? 'active' : 'locked';
                return (
                  <React.Fragment key={level}>
                    <View style={styles.journeyNode}>
                      <View
                        style={[
                          styles.journeyCircle,
                          status === 'active' && styles.journeyCircleActive,
                          status === 'done' && styles.journeyCircleDone,
                        ]}
                      >
                        <Text style={styles.journeyCircleText}>{status === 'locked' ? '🔒' : status === 'done' ? '✅' : '⭐'}</Text>
                      </View>
                      <Text style={[styles.journeyLabel, status === 'locked' && styles.journeyLabelLocked]}>{code}</Text>
                      <Text style={styles.journeySubLabel}>{desc}</Text>
                    </View>
                    {i < CEFR_LEVELS.length - 1 && (
                      <View style={[styles.journeyConnector, i < currentLevelIndex && styles.journeyConnectorDone]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
