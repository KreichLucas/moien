import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LessonNode } from '../components/LessonNode';
import { LessonStartModal } from '../components/LessonStartModal';
import { StreakCalendar } from '../components/StreakCalendar';
import { LEVEL_LABELS, getLevelProgress } from '../content/levels';
import { PathUnit, buildPathUnits } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';
import { CEFR_LEVELS, Lesson } from '../types/content';
import { useAnimatedNumber } from '../utils/useAnimatedNumber';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Horizontal wave offsets (as a multiple of NODE_OFFSET) applied per lesson
// along the whole path, so the trail winds left-right like a real trilha.
const WAVE_PATTERN = [0, 0.9, 1.3, 0.9, 0, -0.9, -1.3, -0.9];
const NODE_OFFSET = 52;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<{ lesson: Lesson; unit: PathUnit } | null>(null);

  const pathUnits = useMemo(() => buildPathUnits(units), []);
  const allLessons = pathUnits.flatMap((u) => u.lessons);
  const levelsPresent = CEFR_LEVELS.filter((lvl) => units.some((u) => u.level === lvl));
  const levelProgress = getLevelProgress(units, progress.completedLessonIds);
  const levelPct =
    levelProgress.total > 0 ? Math.min(100, Math.round((levelProgress.completed / levelProgress.total) * 100)) : 0;

  const animatedXp = useAnimatedNumber(progress.xp);
  const levelFillWidth = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(levelFillWidth, { toValue: levelPct, duration: 700, useNativeDriver: false }).start();
  }, [levelPct]);

  const handleStart = () => {
    if (!selected) return;
    const lessonId = selected.lesson.id;
    setSelected(null);
    navigation.navigate('Lesson', { lessonId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate('Streak')} hitSlop={8}>
          <Text style={styles.streak}>🔥 {progress.streak}</Text>
        </Pressable>
        <Text style={styles.xp}>⭐ {animatedXp} XP</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.streakCard, pressedStyle(pressed)]}
        onPress={() => navigation.navigate('Streak')}
      >
        <StreakCalendar activeDates={progress.activeDates} />
      </Pressable>

      <View style={styles.levelCard}>
        <Text style={styles.levelCardTitle}>
          {levelProgress.isMaxLevel
            ? `Nível ${levelProgress.level} concluído! 🏆`
            : `Rumo ao nível ${levelProgress.level}`}
        </Text>
        <View style={styles.levelTrack}>
          <Animated.View
            style={[
              styles.levelFill,
              { width: levelFillWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
            ]}
          />
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
            .map((unit) => {
              const unitCompleted = unit.lessons.every((l) => progress.completedLessonIds.includes(l.id));
              return (
                <View key={unit.id} style={[styles.unit, unit.isReview && styles.reviewUnit]}>
                  <Text style={styles.unitTitle}>
                    {unit.isReview ? '🔁 ' : ''}
                    {unit.title}
                  </Text>
                  <Text style={styles.unitDescription}>{unit.description}</Text>
                  <View style={styles.trail}>
                    {unit.lessons.map((lesson) => {
                      const isCompleted = progress.completedLessonIds.includes(lesson.id);
                      const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
                      const isFirst = lessonIndex === 0;
                      const previousCompleted =
                        !isFirst && progress.completedLessonIds.includes(allLessons[lessonIndex - 1].id);
                      const status = isCompleted ? 'completed' : isFirst || previousCompleted ? 'unlocked' : 'locked';
                      const offset = WAVE_PATTERN[lessonIndex % WAVE_PATTERN.length] * NODE_OFFSET;

                      return (
                        <View key={lesson.id} style={{ transform: [{ translateX: offset }] }}>
                          <LessonNode
                            title={lesson.title}
                            status={status}
                            icon={unit.isReview ? '🔁' : undefined}
                            onPress={() => setSelected({ lesson, unit })}
                          />
                        </View>
                      );
                    })}
                  </View>
                  {unitCompleted && (
                    <View style={styles.chestRow}>
                      <Text style={styles.chestIcon}>🎁</Text>
                      <Text style={styles.chestText}>Unidade completa!</Text>
                    </View>
                  )}
                </View>
              );
            })}
        </View>
      ))}

      <LessonStartModal
        visible={!!selected}
        title={selected?.lesson.title ?? ''}
        isReview={selected?.unit.isReview}
        isCompleted={!!selected && progress.completedLessonIds.includes(selected.lesson.id)}
        onStart={handleStart}
        onClose={() => setSelected(null)}
      />
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
      ...cardShadow(colors),
    },
    levelCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 28,
      ...cardShadow(colors),
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
      ...cardShadow(colors),
    },
    unitTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
    unitDescription: { fontSize: 14, color: colors.textSecondary, marginBottom: 12 },
    trail: { alignItems: 'center' },
    chestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    chestIcon: { fontSize: 22 },
    chestText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  });
}
