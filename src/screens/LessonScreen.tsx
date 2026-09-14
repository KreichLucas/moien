import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExerciseFillBlank } from '../components/ExerciseFillBlank';
import { ExerciseMatch } from '../components/ExerciseMatch';
import { ExerciseMultipleChoice } from '../components/ExerciseMultipleChoice';
import { ExerciseOrderWords } from '../components/ExerciseOrderWords';
import { ExerciseTranslate } from '../components/ExerciseTranslate';
import { ProgressBar } from '../components/ProgressBar';
import { findLessonById } from '../content/path';
import { units } from '../content/units';
import { buildSession, insertMicroReview, SessionCard } from '../learning/engine';
import { EXERCISE_INDEX, ITEM_REGISTRY } from '../learning/registry';
import { DYNAMIC_REVIEW_LESSON_ID, getCachedReviewLesson } from '../learning/reviewSession';
import { AttemptResult, ExerciseOutcome } from '../learning/types';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors, useTheme } from '../theme/theme';
import { useProgress } from '../state/ProgressContext';
import { playComplete, playCorrect, playWrong } from '../utils/sounds';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

/** How many of a session's misses on the same item trigger a same-session reinforcement card. */
const MICRO_REVIEW_THRESHOLD = 2;
const MICRO_REVIEW_MAX_PER_SESSION = 3;

export function LessonScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const lesson =
    lessonId === DYNAMIC_REVIEW_LESSON_ID ? getCachedReviewLesson()! : findLessonById(units, lessonId)!;
  const { progress, completeLesson } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The static per-level review lesson from content/path.ts keeps its own
  // fixed, deterministically-shuffled exercise set — the dynamic engine
  // only builds sessions for regular lessons.
  const isStaticReviewLesson = lessonId.startsWith('review-');

  const [queue, setQueue] = useState<SessionCard[]>(() => {
    if (isStaticReviewLesson) {
      return lesson.exercises.map((exercise) => ({ exercise, isReview: true }));
    }
    return buildSession({
      lesson,
      exerciseIndex: EXERCISE_INDEX,
      registry: ITEM_REGISTRY,
      masteryMap: progress.itemMastery,
      recentAttempts: progress.recentAttempts,
      now: new Date().toISOString(),
    });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const attemptsRef = useRef<AttemptResult[]>([]);
  const missedCountRef = useRef<Record<string, number>>({});
  const microReviewedRef = useRef<Set<string>>(new Set());

  const card = queue[currentIndex];
  const total = queue.length;

  const finishLesson = (finalMistakes: number, sessionTotal: number) => {
    const correctCount = sessionTotal - finalMistakes;
    const wasPerfect = finalMistakes === 0;
    const xpEarned = 10 + (wasPerfect ? 5 : 0);
    completeLesson(lessonId, xpEarned, wasPerfect, attemptsRef.current);
    playComplete();
    navigation.replace('Result', { xpEarned, correctCount, totalCount: sessionTotal });
  };

  const handleExerciseComplete = (outcome: ExerciseOutcome) => {
    const hadMistake = outcome.itemResults.some((r) => !r.correct);
    if (hadMistake) playWrong();
    else playCorrect();

    // Micro-revisão re-tests are real practice for the learner but must not
    // affect the persisted mastery/SRS state (an instant same-session
    // re-test measures working memory, not learning — see the plan).
    if (!card.isMicroReview) {
      attemptsRef.current = [...attemptsRef.current, ...outcome.itemResults];
    }

    let nextQueue = queue;
    if (!isStaticReviewLesson && !card.isMicroReview) {
      outcome.itemResults.forEach((result) => {
        if (result.correct) return;
        const count = (missedCountRef.current[result.itemId] ?? 0) + 1;
        missedCountRef.current[result.itemId] = count;
        if (
          count >= MICRO_REVIEW_THRESHOLD &&
          !microReviewedRef.current.has(result.itemId) &&
          microReviewedRef.current.size < MICRO_REVIEW_MAX_PER_SESSION
        ) {
          const domainLevel = progress.itemMastery[result.itemId]?.domainLevel ?? 0;
          nextQueue = insertMicroReview(nextQueue, currentIndex, result.itemId, domainLevel, ITEM_REGISTRY, EXERCISE_INDEX);
          microReviewedRef.current.add(result.itemId);
        }
      });
      if (nextQueue !== queue) setQueue(nextQueue);
    }

    const newMistakes = mistakes + (hadMistake ? 1 : 0);
    setMistakes(newMistakes);

    const newTotal = nextQueue.length;
    if (currentIndex + 1 >= newTotal) {
      finishLesson(newMistakes, newTotal);
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

      {card.exercise.type === 'multipleChoice' && (
        <ExerciseMultipleChoice key={card.exercise.id} exercise={card.exercise} onComplete={handleExerciseComplete} />
      )}
      {card.exercise.type === 'translate' && (
        <ExerciseTranslate key={card.exercise.id} exercise={card.exercise} onComplete={handleExerciseComplete} />
      )}
      {card.exercise.type === 'match' && (
        <ExerciseMatch key={card.exercise.id} exercise={card.exercise} onComplete={handleExerciseComplete} />
      )}
      {card.exercise.type === 'fillBlank' && (
        <ExerciseFillBlank key={card.exercise.id} exercise={card.exercise} onComplete={handleExerciseComplete} />
      )}
      {card.exercise.type === 'orderWords' && (
        <ExerciseOrderWords key={card.exercise.id} exercise={card.exercise} onComplete={handleExerciseComplete} />
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
