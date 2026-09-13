import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LessonStartModal } from '../components/LessonStartModal';
import { buildPathUnits } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, useTheme } from '../theme/theme';
import { Lesson } from '../types/content';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PracticeScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const pathUnits = useMemo(() => buildPathUnits(units), []);
  const practiceableUnits = pathUnits
    .map((unit) => ({
      ...unit,
      lessons: unit.lessons.filter((l) => progress.completedLessonIds.includes(l.id)),
    }))
    .filter((unit) => unit.lessons.length > 0);

  const handleStart = () => {
    if (!selectedLesson) return;
    const lessonId = selectedLesson.id;
    setSelectedLesson(null);
    navigation.navigate('Lesson', { lessonId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Praticar</Text>
      <Text style={styles.subtitle}>Refaça qualquer lição já concluída, na ordem que quiser.</Text>

      {practiceableUnits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyText}>Complete lições na trilha para poder praticá-las aqui.</Text>
        </View>
      ) : (
        practiceableUnits.map((unit) => (
          <View key={unit.id} style={styles.unitBlock}>
            <Text style={styles.unitTitle}>
              {unit.isReview ? '🔁 ' : ''}
              {unit.title}
            </Text>
            <View style={styles.lessonGrid}>
              {unit.lessons.map((lesson) => (
                <Pressable
                  key={lesson.id}
                  style={styles.lessonCard}
                  onPress={() => setSelectedLesson(lesson)}
                >
                  <Text style={styles.lessonIcon}>✓</Text>
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      <LessonStartModal
        visible={!!selectedLesson}
        title={selectedLesson?.title ?? ''}
        isCompleted
        onStart={handleStart}
        onClose={() => setSelectedLesson(null)}
      />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 24 },
    emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 24 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    unitBlock: { marginBottom: 24 },
    unitTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
    lessonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    lessonCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      alignItems: 'flex-start',
    },
    lessonIcon: {
      fontSize: 16,
      color: colors.buttonTextOnPrimary,
      backgroundColor: colors.primary,
      width: 26,
      height: 26,
      borderRadius: 13,
      textAlign: 'center',
      lineHeight: 26,
      overflow: 'hidden',
      marginBottom: 8,
    },
    lessonTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  });
}
