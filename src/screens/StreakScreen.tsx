import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ACHIEVEMENTS } from '../content/achievements';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, useTheme } from '../theme/theme';
import { units } from '../content/units';

type Props = NativeStackScreenProps<RootStackParamList, 'Streak'>;

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function StreakScreen({ navigation }: Props) {
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const streakSociety = ACHIEVEMENTS.find((a) => a.id === 'streak_7')!;
  const streakSocietyUnlocked = streakSociety.isUnlocked(progress, units);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ofensiva</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.streakHero}>
        <Text style={styles.streakFlame}>🔥</Text>
        <Text style={styles.streakNumber}>{progress.streak}</Text>
        <Text style={styles.streakLabel}>
          {progress.streak === 1 ? 'dia de ofensiva!' : 'dias de ofensiva!'}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>✅ {activeDaysThisMonth}</Text>
          <Text style={styles.statLabel}>Dias de prática</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {progress.xp}</Text>
          <Text style={styles.statLabel}>XP total</Text>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <Pressable style={styles.monthArrowHit} onPress={goPrevMonth}>
            <Text style={styles.monthArrow}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_LABELS[viewMonth]} de {viewYear}
          </Text>
          <Pressable style={styles.monthArrowHit} onPress={goNextMonth}>
            <Text style={styles.monthArrow}>›</Text>
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
                  <Text style={[styles.dayText, isActive && styles.dayTextActive]}>
                    {isActive ? '🔥' : day}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.achievementCard}>
        <Text style={styles.achievementIcon}>{streakSocietyUnlocked ? '🔥' : '🔒'}</Text>
        <View style={styles.achievementTextWrap}>
          <Text style={styles.achievementTitle}>Sociedade da Chama Acesa</Text>
          <Text style={styles.achievementText}>
            {streakSocietyUnlocked
              ? 'Desbloqueada! Sua maior ofensiva foi de ' + progress.maxStreak + ' dias.'
              : 'Consiga uma ofensiva de 7 dias para desbloquear'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    close: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    headerSpacer: { width: 22 },
    streakHero: { alignItems: 'center', marginBottom: 24 },
    streakFlame: { fontSize: 56 },
    streakNumber: { fontSize: 44, fontWeight: '800', color: colors.text, marginTop: 4 },
    streakLabel: { fontSize: 15, color: colors.textSecondary, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    statValue: { fontSize: 20, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    calendarCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    monthRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    monthArrowHit: { paddingHorizontal: 12, paddingVertical: 4 },
    monthArrow: { fontSize: 22, color: colors.accent, fontWeight: '700' },
    monthLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    weekdayRow: { flexDirection: 'row', marginBottom: 8 },
    weekdayLabel: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 8 },
    dayCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleActive: { backgroundColor: colors.streakActiveBg, borderWidth: 2, borderColor: colors.streakActiveBorder },
    dayCircleToday: { borderWidth: 2, borderColor: colors.accent },
    dayText: { fontSize: 13, color: colors.text, fontWeight: '600' },
    dayTextActive: { fontSize: 15 },
    achievementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
    },
    achievementIcon: { fontSize: 28 },
    achievementTextWrap: { flex: 1 },
    achievementTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    achievementText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  });
}
