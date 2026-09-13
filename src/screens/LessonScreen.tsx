import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExerciseFillBlank } from '../components/ExerciseFillBlank';
import { ExerciseMatch } from '../components/ExerciseMatch';
import { ExerciseMultipleChoice } from '../components/ExerciseMultipleChoice';
import { ExerciseTranslate } from '../components/ExerciseTranslate';
import { ProgressBar } from '../components/ProgressBar';
import { findLessonById } from '../content/path';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors, useTheme } from '../theme/theme';
import { useProgress } from '../state/ProgressContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

export function LessonScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const lesson = findLessonById(units, lessonId)!;
  const { completeLesson } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const exercise = lesson.exercises[currentIndex];
  const total = lesson.exercises.length;

  const finishLesson = (finalMistakes: number) => {
    const correctCount = total - finalMistakes;
    const xpEarned = 10 + (finalMistakes === 0 ? 5 : 0);
    completeLesson(lessonId, xpEarned);
    navigation.replace('Result', { xpEarned, correctCount, totalCount: total });
  };

  const handleExerciseComplete = (hadMistake: boolean) => {
    const newMistakes = mistakes + (hadMistake ? 1 : 0);
    setMistakes(newMistakes);

    if (currentIndex + 1 >= total) {
      finishLesson(newMistakes);
      return;
    }

    setCurrentIndex(currentIndex + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <ProgressBar current={currentIndex} total={total} />
      </View>

      {exercise.type === 'multipleChoice' && (
        <ExerciseMultipleChoice key={exercise.id} exercise={exercise} onComplete={handleExerciseComplete} />
      )}
      {exercise.type === 'translate' && (
        <ExerciseTranslate key={exercise.id} exercise={exercise} onComplete={handleExerciseComplete} />
      )}
      {exercise.type === 'match' && (
        <ExerciseMatch key={exercise.id} exercise={exercise} onComplete={handleExerciseComplete} />
      )}
      {exercise.type === 'fillBlank' && (
        <ExerciseFillBlank key={exercise.id} exercise={exercise} onComplete={handleExerciseComplete} />
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 12,
    },
    close: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
  });
}
