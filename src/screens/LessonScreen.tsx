import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ExerciseFillBlank } from '../components/ExerciseFillBlank';
import { ExerciseMatch } from '../components/ExerciseMatch';
import { ExerciseMultipleChoice } from '../components/ExerciseMultipleChoice';
import { ExerciseOrderWords } from '../components/ExerciseOrderWords';
import { ExerciseTranslate } from '../components/ExerciseTranslate';
import { PremiumDiamondRow } from '../components/PremiumDiamondRow';
import { ProgressBar } from '../components/ProgressBar';
import { buildPathUnits, findLessonById } from '../content/path';
import { units } from '../content/units';
import { buildSession, insertMicroReview, SessionCard } from '../learning/engine';
import { EXERCISE_INDEX, ITEM_REGISTRY } from '../learning/registry';
import { DYNAMIC_REVIEW_LESSON_ID, getCachedReviewLesson } from '../learning/reviewSession';
import { AttemptResult, ExerciseOutcome } from '../learning/types';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { useAutoFitScale } from '../utils/useAutoFitScale';
import { authColors } from './authStyles';
import { CONTENT_WIDTH, makeLessonChromeStyles } from './lessonStyles';
import { playComplete, playCorrect, playWrong } from '../utils/sounds';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

/** How many of a session's misses on the same item trigger a same-session reinforcement card. */
const MICRO_REVIEW_THRESHOLD = 2;
const MICRO_REVIEW_MAX_PER_SESSION = 3;

export function LessonScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const lesson =
    lessonId === DYNAMIC_REVIEW_LESSON_ID ? getCachedReviewLesson()! : findLessonById(units, lessonId)!;
  const { progress, completeLesson, savePendingLesson, markPendingReview, spendDiamond } = useProgress();
  const styles = useMemo(() => makeLessonChromeStyles(), []);
  const { onStageLayout, onNaturalLayout, scale } = useAutoFitScale();
  // Width is handled responsively (shrinks with the viewport on narrow
  // phones, same as any normal layout) rather than through the scale
  // transform below — scaling width down uniformly with everything else
  // would shrink the font pixel-for-pixel with it, and on a real phone
  // that reads as illegibly small well before the design's natural size is
  // reached. The scale transform is left to do only what plain responsive
  // width can't: shrinking the whole card when it's simply too TALL for a
  // short viewport (a laptop window, a landscape phone, etc).
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(CONTENT_WIDTH, windowWidth - 40);
  // Below this the exit link + breadcrumb/progress + diamonds don't all
  // fit on one row even with wrapping — see `headerNarrow`.
  const isHeaderNarrow = contentWidth < 460;
  // Which module owns this lesson, for the header breadcrumb — undefined
  // for the dynamic Praticar session, which isn't part of any unit's fixed
  // path, so the breadcrumb just falls back to the lesson's own title.
  const parentUnit = useMemo(() => buildPathUnits(units).find((u) => u.lessons.some((l) => l.id === lessonId)), [lessonId]);

  // The static per-level review lesson from content/path.ts keeps its own
  // fixed, deterministically-shuffled exercise set — the dynamic engine
  // only builds sessions for regular lessons.
  const isStaticReviewLesson = lessonId.startsWith('review-');
  // Diamonds are a "real lesson" mechanic — Praticar/Revisão sessions (both
  // the static per-level ones and the dynamic due-review one) ARE the
  // recovery path, so they don't themselves cost diamonds.
  const diamondsEnabled = !isStaticReviewLesson && lessonId !== DYNAMIC_REVIEW_LESSON_ID;
  const pending =
    diamondsEnabled && progress.pendingLesson?.lessonId === lessonId ? progress.pendingLesson : null;

  const [queue, setQueue] = useState<SessionCard[]>(() => {
    if (pending) return pending.queue;
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

  const [currentIndex, setCurrentIndex] = useState(pending?.currentIndex ?? 0);
  const [mistakes, setMistakes] = useState(pending?.mistakes ?? 0);
  const [missedItemIds, setMissedItemIds] = useState<string[]>(pending?.missedItemIds ?? []);
  const attemptsRef = useRef<AttemptResult[]>(pending?.attempts ?? []);
  const missedCountRef = useRef<Record<string, number>>({});
  const microReviewedRef = useRef<Set<string>>(new Set());
  // Wall-clock start of this screen — good enough for the "tempo da lição"
  // stat on the result screen; a resumed pending lesson just starts the
  // clock over rather than trying to reconstruct time already spent.
  const startTimeRef = useRef(Date.now());

  const card = queue[currentIndex];
  const total = queue.length;

  const finishLesson = (finalMistakes: number, sessionTotal: number, remainingLives: number) => {
    const correctCount = sessionTotal - finalMistakes;
    const wasPerfect = finalMistakes === 0;
    const xpEarned = 10 + (wasPerfect ? 5 : 0);
    completeLesson(lessonId, xpEarned, wasPerfect, attemptsRef.current);
    playComplete();
    const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    navigation.replace('Result', {
      xpEarned,
      correctCount,
      totalCount: sessionTotal,
      elapsedSeconds,
      lives: remainingLives,
      unitTitle: parentUnit?.title,
      lessonTitle: lesson.title,
    });
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
      // Live, per-answer: marks/clears Praticar's pending-review flag
      // immediately, independent of xp/mastery (which stay batched until
      // completeLesson) — so a mistake shows up there even if this lesson
      // gets paused for diamonds or abandoned without ever finishing.
      markPendingReview(outcome.itemResults);
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

    // Diamonds: a single account-wide resource now (see ProgressContext's
    // SPEND_DIAMOND), lost on any missed question (same "hadMistake" signal
    // the mistake counter already uses), never on a micro-review re-test —
    // that would charge twice for the same underlying miss, since
    // micro-review only exists because the miss was already counted once.
    // `newLives` is computed locally (not read back from `progress` after
    // dispatching) purely for this handler's own control flow below —
    // dispatch doesn't update `progress` synchronously within this call.
    let newLives = progress.diamonds;
    let newMissedItemIds = missedItemIds;
    if (diamondsEnabled && hadMistake && !card.isMicroReview) {
      newLives = Math.max(0, progress.diamonds - 1);
      spendDiamond();
      const missedIds = outcome.itemResults.filter((r) => !r.correct).map((r) => r.itemId);
      const toAdd = missedIds.filter((id) => !missedItemIds.includes(id));
      newMissedItemIds = toAdd.length > 0 ? [...missedItemIds, ...toAdd] : missedItemIds;
      setMissedItemIds(newMissedItemIds);
    }

    const newMistakes = mistakes + (hadMistake ? 1 : 0);
    setMistakes(newMistakes);

    const newTotal = nextQueue.length;
    const isLastCard = currentIndex + 1 >= newTotal;

    if (diamondsEnabled && newLives <= 0 && !isLastCard) {
      // Out of diamonds with lesson content still left — pause here rather
      // than losing the queue position, and send the learner to recover
      // exactly the items they just missed (not the global due queue, which
      // a same-session miss usually isn't in yet).
      savePendingLesson({
        lessonId,
        queue: nextQueue,
        currentIndex: currentIndex + 1,
        mistakes: newMistakes,
        lives: newLives,
        missedItemIds: newMissedItemIds,
        attempts: attemptsRef.current,
      });
      navigation.replace('OutOfDiamonds', { lessonId });
      return;
    }

    if (isLastCard) {
      finishLesson(newMistakes, newTotal, newLives);
      return;
    }

    setCurrentIndex(currentIndex + 1);
    if (diamondsEnabled) {
      savePendingLesson({
        lessonId,
        queue: nextQueue,
        currentIndex: currentIndex + 1,
        mistakes: newMistakes,
        lives: newLives,
        missedItemIds: newMissedItemIds,
        attempts: attemptsRef.current,
      });
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.stage} onLayout={onStageLayout}>
        <View onLayout={onNaturalLayout}>
          <View style={[styles.scaleContent, { transform: [{ scale }] }]}>
            <View style={[styles.header, { width: contentWidth }, isHeaderNarrow && styles.headerNarrow]}>
              <Pressable onPress={() => navigation.goBack()} style={styles.exitButton} hitSlop={8}>
                <Ionicons name="arrow-back" size={16} color={authColors.textPrimary} />
                <Text style={styles.exitButtonText}>Sair da lição</Text>
              </Pressable>

              <View style={[styles.centerColumn, isHeaderNarrow && styles.centerColumnNarrow]}>
                <View style={styles.breadcrumb}>
                  {parentUnit && <Text style={styles.breadcrumbUnit}>{parentUnit.title}</Text>}
                  {parentUnit && <Text style={styles.breadcrumbSeparator}>›</Text>}
                  <Text style={styles.breadcrumbLesson}>{lesson.title}</Text>
                </View>
                <ProgressBar current={currentIndex} total={total} />
                <Text style={styles.exerciseCounter}>
                  {currentIndex + 1} de {total}
                </Text>
              </View>

              {diamondsEnabled ? <PremiumDiamondRow lives={progress.diamonds} /> : <View />}
            </View>

            <View style={[styles.examCard, { width: contentWidth }]}>
              <View style={styles.examBadgeRow}>
                <Text style={styles.examBadge}>
                  EXERCÍCIO {currentIndex + 1} DE {total}
                </Text>
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
          </View>
        </View>
      </View>
    </View>
  );
}
