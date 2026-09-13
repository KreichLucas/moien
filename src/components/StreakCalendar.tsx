import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme/theme';

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function StreakCalendar({ activeDates }: { activeDates: string[] }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = new Date();
  const todayISO = toISODate(today);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const iso = toISODate(d);
    return {
      label: DAY_LABELS[i],
      isActive: activeDates.includes(iso),
      isToday: iso === todayISO,
    };
  });

  return (
    <View style={styles.row}>
      {days.map((day, i) => (
        <View key={i} style={styles.dayColumn}>
          <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{day.label}</Text>
          <View
            style={[
              styles.circle,
              day.isActive && styles.circleActive,
              day.isToday && !day.isActive && styles.circleToday,
            ]}
          >
            {day.isActive && <Text style={styles.flame}>🔥</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    dayColumn: { alignItems: 'center', gap: 6 },
    dayLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    dayLabelToday: { color: colors.accent },
    circle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circleActive: { backgroundColor: colors.streakActiveBg, borderColor: colors.streakActiveBorder },
    circleToday: { borderColor: colors.accent },
    flame: { fontSize: 16 },
  });
}
