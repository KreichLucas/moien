import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { useAutoFitScale } from '../utils/useAutoFitScale';
import { authColors, fontFamilies } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Streak'>;

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CARD_WIDTH = 480;

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function StreakScreen({ navigation }: Props) {
  const { progress } = useProgress();
  const styles = useMemo(() => makeStyles(), []);
  const { onStageLayout, onNaturalLayout, scale } = useAutoFitScale();

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const todayISO = toISODate(today.getFullYear(), today.getMonth(), today.getDate());
  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  // Same linear-scan logic the old screen used — kept exactly as-is, this
  // is a visual reskin, not a data/logic change.
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
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.stage} onLayout={onStageLayout}>
        <View onLayout={onNaturalLayout}>
          <View style={[styles.scaleContent, { transform: [{ scale }] }]}>
            <View style={styles.card}>
              <Pressable onPress={() => navigation.goBack()} style={styles.closeButton} hitSlop={8}>
                <Ionicons name="close" size={20} color={authColors.textPrimary} />
              </Pressable>

              <View style={styles.encouragementPill}>
                <Text style={styles.encouragementText}>{encouragement}</Text>
                <Ionicons name="star" size={14} color="#FFD65A" />
              </View>

              <View style={styles.badgeWrap}>
                <View style={styles.crownRow}>
                  <View style={[styles.crownPeak, styles.crownPeakSide]} />
                  <View style={[styles.crownPeak, styles.crownPeakCenter]} />
                  <View style={[styles.crownPeak, styles.crownPeakSide]} />
                </View>
                <View style={styles.badgeRow}>
                  <Ionicons name="leaf" size={30} color="#E8C158" style={styles.laurelLeft} />
                  <View style={styles.shieldOuter}>
                    <View style={styles.shieldInner}>
                      <Ionicons name="flame" size={56} color="#FFFFFF" />
                    </View>
                  </View>
                  <Ionicons name="leaf" size={30} color="#E8C158" style={styles.laurelRight} />
                </View>
              </View>

              <Text style={styles.ofensivaLabel}>Ofensiva</Text>
              <Text style={styles.streakNumber}>{progress.streak}</Text>
              <Text style={styles.streakSub}>{streakLabel}</Text>
              <Text style={styles.motivational}>Disciplina hoje,{'\n'}resultados amanhã!</Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statValueRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                    <Text style={styles.statValue}>{activeDaysThisMonth}</Text>
                  </View>
                  <Text style={styles.statLabel}>Dias de prática</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={styles.statValueRow}>
                    <Ionicons name="star" size={18} color="#FFD65A" />
                    <Text style={styles.statValue}>{progress.xp}</Text>
                  </View>
                  <Text style={styles.statLabel}>XP total</Text>
                </View>
              </View>

              <View style={styles.calendarCard}>
                <View style={styles.monthRow}>
                  <Pressable onPress={goPrevMonth} style={styles.monthArrowHit} hitSlop={8}>
                    <Ionicons name="chevron-back" size={18} color={authColors.textSecondary} />
                  </Pressable>
                  <Text style={styles.monthLabel}>
                    {MONTH_LABELS[viewMonth]} de {viewYear}
                  </Text>
                  <Pressable onPress={goNextMonth} style={styles.monthArrowHit} hitSlop={8}>
                    <Ionicons name="chevron-forward" size={18} color={authColors.textSecondary} />
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
                        <View
                          style={[
                            styles.dayCircle,
                            isActive && styles.dayCircleActive,
                            isToday && !isActive && styles.dayCircleToday,
                          ]}
                        >
                          {isActive ? (
                            <Ionicons name="flame" size={16} color={authColors.accentCyan} />
                          ) : (
                            <Text style={styles.dayText}>{day}</Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
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
    blob: { position: 'absolute', borderRadius: 9999, opacity: 0.3 },
    blobTop: { width: 480, height: 480, top: -200, left: -160, backgroundColor: authColors.blobBlue },
    blobBottom: { width: 520, height: 520, bottom: -220, right: -180, backgroundColor: authColors.blobCyan },

    stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    scaleContent: { alignItems: 'center' },

    card: {
      width: CARD_WIDTH,
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 32,
      paddingTop: 20,
      paddingBottom: 28,
      paddingHorizontal: 28,
      alignItems: 'center',
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 40,
      elevation: 12,
    },
    closeButton: {
      position: 'absolute',
      top: 18,
      left: 18,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.inputBorder,
    },
    encouragementPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-end',
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginBottom: 8,
    },
    encouragementText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 11, color: authColors.textSecondary },

    badgeWrap: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
    crownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginBottom: -6, zIndex: 1 },
    crownPeak: {
      width: 0,
      height: 0,
      borderLeftWidth: 9,
      borderRightWidth: 9,
      borderBottomWidth: 16,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: '#F0C94A',
    },
    crownPeakSide: { transform: [{ scale: 0.75 }] },
    crownPeakCenter: {},
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    laurelLeft: { transform: [{ rotate: '-20deg' }] },
    laurelRight: { transform: [{ scaleX: -1 }, { rotate: '-20deg' }] },
    shieldOuter: {
      width: 112,
      height: 124,
      backgroundColor: '#E8C158',
      alignItems: 'center',
      justifyContent: 'center',
      // @ts-expect-error web-only CSS property, valid on this web-only build
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)',
      shadowColor: '#F0C94A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 8,
    },
    shieldInner: {
      width: 98,
      height: 110,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      clipPath: 'polygon(0% 0%, 100% 0%, 100% 62%, 50% 100%, 0% 62%)',
    },

    ofensivaLabel: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textSecondary, marginTop: 4 },
    streakNumber: { fontFamily: fontFamilies.displayExtraBold, fontSize: 56, color: authColors.textPrimary, lineHeight: 62 },
    streakSub: { fontFamily: fontFamilies.displayBold, fontSize: 16, color: authColors.textPrimary, marginTop: 2 },
    motivational: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 13,
      color: authColors.accentCyan,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 18,
    },

    statsRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 22 },
    statCard: {
      flex: 1,
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
    },
    statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statValue: { fontFamily: fontFamilies.displayExtraBold, fontSize: 18, color: authColors.textPrimary },
    statLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: authColors.textSecondary, marginTop: 4 },

    calendarCard: {
      width: '100%',
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 20,
      padding: 16,
      marginTop: 16,
    },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    monthArrowHit: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
    },
    monthLabel: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
    weekdayRow: { flexDirection: 'row', marginBottom: 6 },
    weekdayLabel: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 11,
      color: authColors.textMuted,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 6 },
    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleActive: { backgroundColor: 'rgba(56, 189, 248, 0.16)', borderWidth: 1, borderColor: authColors.accentCyan },
    dayCircleToday: { borderWidth: 1, borderColor: authColors.textMuted },
    dayText: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary },
  });
}
