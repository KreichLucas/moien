import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LessonNode } from '../components/LessonNode';
import { LessonStartModal } from '../components/LessonStartModal';
import { buildPathUnits, getLessonStatus } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, useTheme } from '../theme/theme';
import { Lesson } from '../types/content';

type Props = NativeStackScreenProps<RootStackParamList, 'Objective'>;

// Same winding pattern HomeScreen uses for its trail, so a "barra" list
// feels like the same path instead of a plain straight list.
const WAVE_PATTERN = [0, 0.9, 1.3, 0.9, 0];
const NODE_OFFSET = 44;

export function ObjectiveScreen({ route, navigation }: Props) {
  const { unitId } = route.params;
  const unit = units.find((u) => u.id === unitId)!;
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const allLessons = useMemo(() => buildPathUnits(units).flatMap((u) => u.lessons), []);
  const completedCount = unit.lessons.filter((l) => progress.completedLessonIds.includes(l.id)).length;

  const handleStart = () => {
    if (!selectedLesson) return;
    const lessonId = selectedLesson.id;
    setSelectedLesson(null);
    navigation.navigate('Lesson', { lessonId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.icon}>{unit.icon ?? '⭐'}</Text>
      <Text style={styles.title}>{unit.title}</Text>
      <Text style={styles.description}>{unit.description}</Text>
      <Text style={styles.progressLabel}>
        {completedCount}/{unit.lessons.length} barras concluídas
      </Text>

      <View style={styles.trail}>
        {unit.lessons.map((lesson, i) => {
          const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
          const status = getLessonStatus(allLessons, lessonIndex, progress.completedLessonIds);
          const offset = WAVE_PATTERN[i % WAVE_PATTERN.length] * NODE_OFFSET;
          return (
            <View key={lesson.id} style={{ transform: [{ translateX: offset }] }}>
              <LessonNode
                title={`Barra ${i + 1}`}
                status={status}
                onPress={() => setSelectedLesson(lesson)}
              />
              <Text style={styles.barSubtitle}>{lesson.title.split(' · ')[1] ?? lesson.title}</Text>
            </View>
          );
        })}
      </View>

      {completedCount === unit.lessons.length && (
        <View style={styles.doneRow}>
          <Text style={styles.doneIcon}>🎉</Text>
          <Text style={styles.doneText}>Objetivo concluído!</Text>
        </View>
      )}

      <LessonStartModal
        visible={!!selectedLesson}
        title={selectedLesson?.title ?? ''}
        isCompleted={!!selectedLesson && progress.completedLessonIds.includes(selectedLesson.id)}
        onStart={handleStart}
        onClose={() => setSelectedLesson(null)}
      />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: 60, alignItems: 'center' },
    header: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    close: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
    headerSpacer: { width: 22 },
    icon: { fontSize: 48, marginTop: 8 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 8, textAlign: 'center' },
    description: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
    progressLabel: { fontSize: 13, fontWeight: '700', color: colors.accent, marginTop: 12, marginBottom: 24 },
    trail: { alignItems: 'center', width: '100%' },
    barSubtitle: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', marginTop: -4, marginBottom: 6 },
    doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
    doneIcon: { fontSize: 24 },
    doneText: { fontSize: 15, fontWeight: '700', color: colors.text },
  });
}
