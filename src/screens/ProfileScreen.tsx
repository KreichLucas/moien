import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getLevelProgress } from '../content/levels';
import { units } from '../content/units';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, useTheme } from '../theme/theme';

export function ProfileScreen() {
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const totalLessons = units.flatMap((u) => u.lessons).length;
  const levelProgress = getLevelProgress(units, progress.completedLessonIds);

  return (
    <View style={styles.container}>
      <Text style={styles.avatar}>🧑‍🎓</Text>
      <Text style={styles.title}>Seu progresso</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {progress.xp}</Text>
          <Text style={styles.statLabel}>XP total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {progress.streak}</Text>
          <Text style={styles.statLabel}>Dias seguidos</Text>
        </View>
      </View>

      <View style={styles.statCardFull}>
        <Text style={styles.statValue}>
          {progress.completedLessonIds.length} / {totalLessons}
        </Text>
        <Text style={styles.statLabel}>Lições completas</Text>
      </View>

      <View style={styles.statCardFull}>
        <Text style={styles.statValue}>{levelProgress.level}</Text>
        <Text style={styles.statLabel}>
          {levelProgress.isMaxLevel ? 'Nível máximo alcançado' : 'Nível atual em progresso'}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20, alignItems: 'center' },
    avatar: { fontSize: 64, marginTop: 20 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, marginVertical: 16 },
    statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    statCardFull: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginTop: 12,
    },
    statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  });
}
