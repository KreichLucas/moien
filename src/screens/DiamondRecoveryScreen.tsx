import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { DiamondRow } from '../components/DiamondRow';
import { ExerciseFillBlank } from '../components/ExerciseFillBlank';
import { ExerciseMatch } from '../components/ExerciseMatch';
import { ExerciseMultipleChoice } from '../components/ExerciseMultipleChoice';
import { ExerciseOrderWords } from '../components/ExerciseOrderWords';
import { ExerciseTranslate } from '../components/ExerciseTranslate';
import { pickNextRecoveryExercise } from '../learning/reviewSession';
import { EXERCISE_INDEX, ITEM_REGISTRY } from '../learning/registry';
import { ExerciseOutcome } from '../learning/types';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';
import { playComplete, playCorrect, playWrong } from '../utils/sounds';

type Props = NativeStackScreenProps<RootStackParamList, 'DiamondRecovery'>;

const MAX_LIVES = 5;

export function DiamondRecoveryScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const { progress, recordPracticeAttempts, savePendingLesson } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pending = progress.pendingLesson?.lessonId === lessonId ? progress.pendingLesson : null;
  const [cursor, setCursor] = useState(0);
  const [round, setRound] = useState(0);

  const lives = pending?.lives ?? 0;
  const missedItemIds = pending?.missedItemIds ?? [];
  const recovered = lives >= MAX_LIVES;

  const next = useMemo(() => {
    if (recovered || missedItemIds.length === 0) return null;
    return pickNextRecoveryExercise(missedItemIds, cursor, ITEM_REGISTRY, EXERCISE_INDEX, progress.itemMastery);
  }, [cursor, missedItemIds, progress.itemMastery, recovered]);

  if (!pending) {
    // No paused lesson to recover into (e.g. deep-linked directly, or it
    // already finished elsewhere) — nothing sensible to show.
    navigation.replace('Main');
    return null;
  }

  const handleComplete = (outcome: ExerciseOutcome) => {
    if (!next) return;
    recordPracticeAttempts(outcome.itemResults);

    const gotTargetRight = outcome.itemResults.some((r) => r.itemId === next.itemId && r.correct);
    if (gotTargetRight) playCorrect();
    else playWrong();

    const newLives = Math.min(MAX_LIVES, lives + (gotTargetRight ? 1 : 0));
    savePendingLesson({ ...pending, lives: newLives });

    if (newLives >= MAX_LIVES) playComplete();
    setCursor((c) => (c + 1) % missedItemIds.length);
    setRound((r) => r + 1);
  };

  const handleContinue = () => {
    navigation.replace('Lesson', { lessonId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.replace('Main')}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <DiamondRow lives={lives} />
      </View>

      {recovered ? (
        <View style={styles.recoveredWrap}>
          <ConfettiBurst />
          <Text style={styles.recoveredEmoji}>🎉</Text>
          <Text style={styles.recoveredTitle}>Diamantes recuperados!</Text>
          <Text style={styles.recoveredSubtitle}>Você está pronto para continuar a lição.</Text>
          <Pressable style={({ pressed }) => [styles.button, pressedStyle(pressed)]} onPress={handleContinue}>
            <Text style={styles.buttonText}>CONTINUAR</Text>
          </Pressable>
        </View>
      ) : next ? (
        <>
          {next.exercise.type === 'multipleChoice' && (
            <ExerciseMultipleChoice key={`${round}-${next.exercise.id}`} exercise={next.exercise} onComplete={handleComplete} />
          )}
          {next.exercise.type === 'translate' && (
            <ExerciseTranslate key={`${round}-${next.exercise.id}`} exercise={next.exercise} onComplete={handleComplete} />
          )}
          {next.exercise.type === 'match' && (
            <ExerciseMatch key={`${round}-${next.exercise.id}`} exercise={next.exercise} onComplete={handleComplete} />
          )}
          {next.exercise.type === 'fillBlank' && (
            <ExerciseFillBlank key={`${round}-${next.exercise.id}`} exercise={next.exercise} onComplete={handleComplete} />
          )}
          {next.exercise.type === 'orderWords' && (
            <ExerciseOrderWords key={`${round}-${next.exercise.id}`} exercise={next.exercise} onComplete={handleComplete} />
          )}
        </>
      ) : (
        <View style={styles.recoveredWrap}>
          <Text style={styles.recoveredSubtitle}>Nada para praticar no momento.</Text>
          <Pressable style={({ pressed }) => [styles.button, pressedStyle(pressed)]} onPress={() => navigation.replace('Main')}>
            <Text style={styles.buttonText}>VOLTAR</Text>
          </Pressable>
        </View>
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
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 12,
    },
    close: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
    recoveredWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    recoveredEmoji: { fontSize: 72, marginBottom: 16 },
    recoveredTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10, textAlign: 'center' },
    recoveredSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 36 },
    button: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      ...cardShadow(colors),
    },
    buttonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  });
}
