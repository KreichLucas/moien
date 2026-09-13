import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LessonNode } from '../components/LessonNode';
import { StreakCalendar } from '../components/StreakCalendar';
import { LEVEL_LABELS, getLevelProgress } from '../content/levels';
import { buildPathUnits } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, useTheme } from '../theme/theme';
import { CEFR_LEVELS } from '../types/content';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pathUnits = useMemo(() => buildPathUnits(units), []);
  const allLessons = pathUnits.flatMap((u) => u.lessons);
  const levelsPresent = CEFR_LEVELS.filter((lvl) => units.some((u) => u.level === lvl));
  const levelProgress = getLevelProgress(units, progress.completedLessonIds);
  const levelPct =
    levelProgress.total > 0 ? Math.min(100, Math.round((levelProgress.completed / levelProgress.total) * 100)) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.streak}>🔥 {progress.streak}</Text>
        <Text style={styles.xp}>⭐ {progress.xp} XP</Text>
      </View>

      <View style={styles.streakCard}>
        <StreakCalendar activeDates={progress.activeDates} />
      </View>

      <View style={styles.levelCard}>
        <Text style={styles.levelCardTitle}>
          {levelProgress.isMaxLevel
            ? `Nível ${levelProgress.level} concluído! 🏆`
            : `Rumo ao nível ${levelProgress.level}`}
        </Text>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${levelPct}%` }]} />
        </View>
        <Text style={styles.levelCardSubtitle}>
          {levelProgress.completed}/{levelProgress.total} lições
        </Text>
      </View>

      {levelsPresent.map((level) => (
        <View key={level} style={styles.levelSection}>
          <Text style={styles.levelHeader}>{LEVEL_LABELS[level]}</Text>
          {pathUnits
            .filter((u) => u.level === level)
            .map((unit) => (
              <View key={unit.id} style={[styles.unit, unit.isReview && styles.reviewUnit]}>
                <Text style={styles.unitTitle}>{unit.isReview ? '🔁 ' : ''}{unit.title}</Text>
                <Text style={styles.unitDescription}>{unit.description}</Text>
                {unit.lessons.map((lesson) => {
                  const isCompleted = progress.completedLessonIds.includes(lesson.id);
                  const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
                  const isFirst = lessonIndex === 0;
                  const previousCompleted =
                    !isFirst && progress.completedLessonIds.includes(allLessons[lessonIndex - 1].id);
                  const status = isCompleted ? 'completed' : isFirst || previousCompleted ? 'unlocked' : 'locked';

                  return (
                    <LessonNode
                      key={lesson.id}
                      title={lesson.title}
                      status={status}
                      icon={unit.isReview ? '🔁' : undefined}
                      onPress={() => navigation.navigate('Lesson', { lessonId: lesson.id })}
                    />
                  );
                })}
              </View>
            ))}
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    streak: { fontSize: 18, fontWeight: '700', color: colors.text },
    xp: { fontSize: 18, fontWeight: '700', color: colors.text },
    streakCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    levelCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 28,
    },
    levelCardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 10 },
    levelTrack: {
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    levelFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
    levelCardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
    levelSection: { marginBottom: 8 },
    levelHeader: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    unit: { marginBottom: 28 },
    reviewUnit: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: -16,
    },
    unitTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    unitDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
  });
}
