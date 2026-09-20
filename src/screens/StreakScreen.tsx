import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { useHoverGuard } from '../utils/useHoverGuard';
import { authColors, fontFamilies, liftStyle } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Streak'>;

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/**
 * Fixed design canvas the whole screen is composed at, then scaled — both up
 * and down, unlike `useAutoFitScale` — to fill whatever viewport is
 * available. This is a full-bleed layout the reference explicitly asked to
 * keep as ONE composition at every size ("manter os elementos nas mesmas
 * posições relativas... não mudar o design"), so resizing is a uniform
 * zoom of the whole canvas rather than a breakpoint reflow — the background
 * photo underneath still covers the real viewport edge-to-edge on its own,
 * so scaling down never leaves visible dead space, just more of the skyline.
 */
const NATURAL_WIDTH = 1360;
const LEFT_PANEL_WIDTH = 400;

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function useFillScale() {
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const onStageLayout = (e: any) => setStage(e.nativeEvent.layout);
  const onNaturalLayout = (e: any) => setNatural(e.nativeEvent.layout);
  const scale =
    natural.width > 0 && natural.height > 0 && stage.width > 0 && stage.height > 0
      ? Math.min(stage.width / natural.width, stage.height / natural.height)
      : 1;
  return { onStageLayout, onNaturalLayout, scale };
}

export function StreakScreen({ navigation }: Props) {
  const { progress } = useProgress();
  const styles = useMemo(() => makeStyles(), []);
  const { onStageLayout, onNaturalLayout, scale } = useFillScale();
  const isHoverReady = useHoverGuard();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const onHoverIn = (id: string) => () => isHoverReady() && setHoveredId(id);
  const onHoverOut = (id: string) => () => setHoveredId((cur) => (cur === id ? null : cur));

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const activeDaysThisMonth = useMemo(
    () => progress.activeDates.filter((d) => d.startsWith(monthPrefix)).length,
    [progress.activeDates, monthPrefix]
  );

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const streakLabel = progress.streak === 1 ? 'dia de ofensiva!' : 'dias de ofensiva!';
  const encouragement = progress.streak > 0 ? 'Você está no caminho certo!' : 'Comece sua ofensiva hoje!';

  return (
    <View style={styles.page}>
      <ImageBackground
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/WhatsApp Image 2026-09-19 at 21.25.06.jpeg')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(4,11,24,0.58)', 'rgba(4,11,24,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <View style={styles.stage} onLayout={onStageLayout}>
        <View onLayout={onNaturalLayout}>
          <View style={[styles.canvas, { transform: [{ scale }] }]}>
            {/* Top bar */}
            <View style={styles.topBar}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.closeButton, liftStyle(hoveredId === 'close', 22, pressed)]}
                onHoverIn={onHoverIn('close')}
                onHoverOut={onHoverOut('close')}
                hitSlop={8}
              >
                <Ionicons name="close" size={22} color={authColors.textPrimary} />
              </Pressable>

              <View style={styles.encouragementPill}>
                <Text style={styles.encouragementText}>{encouragement}</Text>
                <Ionicons name="star" size={16} color="#FFD65A" />
              </View>
            </View>

            {/* Main two-column row */}
            <View style={styles.mainRow}>
              <View style={styles.leftPanel}>
                <View style={styles.badgeWrap}>
                  <Ionicons name="sparkles" size={13} color="rgba(255,216,120,0.75)" style={styles.sparkleTL} />
                  <Ionicons name="sparkles" size={16} color="rgba(255,216,120,0.6)" style={styles.sparkleTR} />
                  <Ionicons name="sparkles" size={11} color="rgba(255,216,120,0.6)" style={styles.sparkleBL} />
                  <Ionicons name="sparkles" size={14} color="rgba(255,216,120,0.55)" style={styles.sparkleBR} />

                  <View style={styles.topFlameWrap}>
                    <Ionicons name="flame" size={54} color="#FF8A3D" />
                    <Ionicons name="flame" size={30} color="#FFD65A" style={styles.topFlameCore} />
                  </View>

                  <View style={styles.badgeRow}>
                    <Ionicons name="leaf" size={38} color="#E8C158" style={styles.laurelLeft} />
                    <View style={styles.shieldOuter}>
                      <View style={styles.shieldInner}>
                        <Ionicons name="flame" size={68} color="#FFFFFF" />
                      </View>
                    </View>
                    <Ionicons name="leaf" size={38} color="#E8C158" style={styles.laurelRight} />
                  </View>
                </View>

                <Text style={styles.ofensivaLabel}>Ofensiva</Text>
                <Text style={styles.streakNumber}>{progress.streak}</Text>
                <Text style={styles.streakSub}>{streakLabel}</Text>
                <Text style={styles.motivational}>Disciplina hoje,{'\n'}resultados amanhã!</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <View style={styles.statValueRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                      <Text style={styles.statValue}>{activeDaysThisMonth}</Text>
                    </View>
                    <Text style={styles.statLabel}>Dias de prática</Text>
                  </View>
                  <View style={styles.statCard}>
                    <View style={styles.statValueRow}>
                      <Ionicons name="star" size={20} color="#FFD65A" />
                      <Text style={styles.statValue}>{progress.xp}</Text>
                    </View>
                    <Text style={styles.statLabel}>XP total</Text>
                  </View>
                </View>

                <View style={styles.objectiveRow}>
                  <View style={styles.objectiveIconWrap}>
                    <Ionicons name="locate" size={18} color={authColors.accentCyan} />
                  </View>
                  <View style={styles.objectiveTextWrap}>
                    <Text style={styles.objectiveTitle}>Seu objetivo</Text>
                    <Text style={styles.objectiveSubtitle}>Continue aprendendo e mantenha sua ofensiva!</Text>
                  </View>
                </View>
              </View>

              <View style={styles.calendarCard}>
                <View style={styles.monthRow}>
                  <Pressable
                    onPress={goPrevMonth}
                    style={({ pressed }) => [styles.monthArrowHit, liftStyle(hoveredId === 'prev', 22, pressed)]}
                    onHoverIn={onHoverIn('prev')}
                    onHoverOut={onHoverOut('prev')}
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-back" size={20} color={authColors.textPrimary} />
                  </Pressable>
                  <Text style={styles.monthLabel}>
                    {MONTH_LABELS[viewMonth]} de {viewYear}
                  </Text>
                  <Pressable
                    onPress={goNextMonth}
                    style={({ pressed }) => [styles.monthArrowHit, liftStyle(hoveredId === 'next', 22, pressed)]}
                    onHoverIn={onHoverIn('next')}
                    onHoverOut={onHoverOut('next')}
                    hitSlop={8}
                  >
                    <Ionicons name="chevron-forward" size={20} color={authColors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.weekdayRow}>
                  {WEEKDAY_LABELS.map((d) => (
                    <Text key={d} style={styles.weekdayLabel}>
                      {d}
                    </Text>
                  ))}
                </View>

                <View style={styles.grid}>
                  {cells.map((day, i) => {
                    if (day === null) return <View key={i} style={styles.dayCell} />;
                    const iso = toISODate(viewYear, viewMonth, day);
                    const isActive = progress.activeDates.includes(iso);
                    const isToday = iso === todayISO;
                    return (
                      <View key={i} style={styles.dayCell}>
                        {isActive && <Ionicons name="flame" size={15} color="#FF8A3D" style={styles.dayFlame} />}
                        <View
                          style={[
                            styles.dayCircle,
                            isActive && styles.dayCircleActive,
                            isToday && !isActive && styles.dayCircleToday,
                          ]}
                        >
                          <Text style={[styles.dayText, isActive && styles.dayTextActive]}>{day}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Bottom actions */}
            <View style={styles.bottomActions}>
              <Pressable
                onPress={() => navigation.navigate('Learn')}
                onHoverIn={onHoverIn('continue')}
                onHoverOut={onHoverOut('continue')}
                style={({ pressed }) => [liftStyle(hoveredId === 'continue', 999, pressed)]}
              >
                <LinearGradient
                  colors={[authColors.accentCyan, authColors.accentBlue]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueButtonText}>Continuar aprendendo</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Main', { screen: 'Profile' })} hitSlop={8}>
                <Text style={styles.progressLink}>Ver meu progresso</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg, overflow: 'hidden' },
    stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    canvas: { width: NATURAL_WIDTH, paddingHorizontal: 48, paddingVertical: 36 },

    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(13, 25, 48, 0.65)',
      borderWidth: 1.5,
      borderColor: authColors.cardBorder,
    },
    encouragementPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(13, 25, 48, 0.55)',
      borderWidth: 1.5,
      borderColor: authColors.cardBorder,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    encouragementText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 15, color: authColors.textPrimary },

    mainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 48, marginTop: 32 },

    leftPanel: { width: LEFT_PANEL_WIDTH, alignItems: 'center' },

    badgeWrap: { alignItems: 'center', marginBottom: 6 },
    sparkleTL: { position: 'absolute', top: 6, left: 30 },
    sparkleTR: { position: 'absolute', top: -2, right: 24 },
    sparkleBL: { position: 'absolute', bottom: 30, left: 6 },
    sparkleBR: { position: 'absolute', bottom: 46, right: 10 },

    topFlameWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: -14, zIndex: 2 },
    topFlameCore: { position: 'absolute', top: 12 },

    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    laurelLeft: { transform: [{ rotate: '-20deg' }] },
    laurelRight: { transform: [{ scaleX: -1 }, { rotate: '-20deg' }] },
    shieldOuter: {
      width: 152,
      height: 168,
      backgroundColor: '#E8C158',
      alignItems: 'center',
      justifyContent: 'center',
      // @ts-expect-error web-only CSS property, valid on this web-only build
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)',
      shadowColor: '#F0C94A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 28,
      elevation: 10,
    },
    shieldInner: {
      width: 134,
      height: 150,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: '#F0C94A',
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)',
    },

    ofensivaLabel: { fontFamily: fontFamilies.displaySemiBold, fontSize: 16, color: authColors.textSecondary, marginTop: 6 },
    streakNumber: { fontFamily: fontFamilies.displayExtraBold, fontSize: 76, color: authColors.textPrimary, lineHeight: 84 },
    streakSub: { fontFamily: fontFamilies.displayBold, fontSize: 20, color: authColors.textPrimary, marginTop: 2 },
    motivational: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 15,
      color: authColors.accentCyan,
      textAlign: 'center',
      marginTop: 14,
      lineHeight: 20,
    },

    statsRow: { flexDirection: 'row', gap: 14, width: '100%', marginTop: 26 },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(13, 25, 48, 0.55)',
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
    },
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    statValue: { fontFamily: fontFamilies.displayExtraBold, fontSize: 20, color: authColors.textPrimary },
    statLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary, marginTop: 5 },

    objectiveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', marginTop: 24 },
    objectiveIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(56, 189, 248, 0.4)',
    },
    objectiveTextWrap: { flex: 1 },
    objectiveTitle: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
    objectiveSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary, marginTop: 2, lineHeight: 16 },

    calendarCard: {
      flex: 1,
      backgroundColor: 'rgba(9, 18, 36, 0.72)',
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 28,
      padding: 32,
    },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
    monthArrowHit: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(13, 25, 48, 0.6)',
      borderWidth: 1.5,
      borderColor: authColors.cardBorder,
    },
    monthLabel: { fontFamily: fontFamilies.displayBold, fontSize: 26, color: authColors.textPrimary },
    weekdayRow: { flexDirection: 'row', marginBottom: 8 },
    weekdayLabel: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 15,
      color: authColors.textSecondary,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'flex-end', height: 74, marginBottom: 4 },
    dayFlame: { marginBottom: 2 },
    dayCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleActive: {
      backgroundColor: 'rgba(255, 138, 61, 0.14)',
      borderWidth: 2,
      borderColor: '#FF8A3D',
      shadowColor: '#FF8A3D',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
      elevation: 6,
    },
    dayCircleToday: { borderWidth: 1.5, borderColor: authColors.textMuted },
    dayText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 17, color: authColors.textPrimary },
    dayTextActive: { color: '#FFB067', fontFamily: fontFamilies.displayBold },

    bottomActions: { alignItems: 'center', marginTop: 32 },
    continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      borderRadius: 999,
      paddingVertical: 16,
      paddingHorizontal: 36,
      shadowColor: authColors.accentCyan,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 6,
    },
    continueButtonText: { color: '#FFFFFF', fontFamily: fontFamilies.displayBold, fontSize: 16, letterSpacing: 0.5 },
    progressLink: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 14,
      color: authColors.accentCyan,
      marginTop: 14,
      textDecorationLine: 'underline',
    },
  });
}
