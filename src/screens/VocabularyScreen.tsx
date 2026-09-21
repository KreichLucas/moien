import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ExerciseMatch } from '../components/ExerciseMatch';
import { ITEM_REGISTRY } from '../learning/registry';
import { DomainLevel, ExerciseOutcome } from '../learning/types';
import { useProgress } from '../state/ProgressContext';
import { MatchExercise } from '../types/content';
import { shuffle } from '../utils/shuffle';
import { authColors, fontFamilies } from './authStyles';

/**
 * Vocabulário reviews words the learner already met in real Lições — it
 * reads the exact same source of truth as Perfil's vocabulary table and
 * Prática's pending list (progress.itemMastery / ITEM_REGISTRY), and
 * reuses ExerciseMatch (the same matching widget real match-pair
 * exercises already use) instead of a second matching UI. No parallel
 * word bank, no parallel progress/XP system — see ProgressContext's
 * RECORD_VOCAB_ROUND for exactly what this does and doesn't touch.
 */
const ROUND_SIZE = 5;
const BASE_ROUND_XP = 5;
const PERFECT_ROUND_BONUS_XP = 3;

interface LearnedWord {
  itemId: string;
  pt: string;
  lu: string;
  domainLevel: DomainLevel;
  timesWrong: number;
}

/**
 * Weighted sample without replacement — words missed more, or mastered
 * less (lower domainLevel), are more likely to be picked, using the exact
 * mastery counters the SRS engine (learning/srs.ts) already tracks per
 * item. Falls back to "use everything, just shuffled" once the pool is at
 * or below the round size, matching the "don't show an empty screen"
 * requirement for a learner who's only unlocked a couple of words.
 */
function pickRoundWords(pool: LearnedWord[], size: number): LearnedWord[] {
  if (pool.length <= size) return shuffle(pool);
  const remaining = pool.map((w) => ({ w, weight: 1 + w.timesWrong * 2 + Math.max(0, 3 - w.domainLevel) }));
  const picked: LearnedWord[] = [];
  while (picked.length < size && remaining.length > 0) {
    const totalWeight = remaining.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;
    let idx = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      roll -= remaining[i].weight;
      if (roll <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(remaining[idx].w);
    remaining.splice(idx, 1);
  }
  return picked;
}

export function VocabularyScreen() {
  const { progress, recordVocabRound } = useProgress();
  const styles = useMemo(() => makeStyles(), []);

  const [roundIndex, setRoundIndex] = useState(0);
  const [roundWords, setRoundWords] = useState<LearnedWord[] | null>(null);
  const [roundResult, setRoundResult] = useState<{ correct: number; total: number; xpEarned: number } | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  const pool = useMemo<LearnedWord[]>(() => {
    return Object.entries(progress.itemMastery)
      .map(([itemId, mastery]) => {
        const item = ITEM_REGISTRY.items[itemId];
        if (!item || item.kind !== 'word') return null;
        return { itemId, pt: item.displayPt, lu: item.displayLu, domainLevel: mastery.domainLevel, timesWrong: mastery.timesWrong };
      })
      .filter((w): w is LearnedWord => w !== null);
  }, [progress.itemMastery]);

  const direction: 'pt-lu' | 'lu-pt' = roundIndex % 2 === 0 ? 'pt-lu' : 'lu-pt';

  useEffect(() => {
    if (roundResult) {
      fade.setValue(0);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    }
  }, [roundResult, fade]);

  const startRound = () => {
    setRoundResult(null);
    setRoundWords(pickRoundWords(pool, ROUND_SIZE));
  };

  const handleRoundComplete = (outcome: ExerciseOutcome) => {
    const correct = outcome.itemResults.filter((r) => r.correct).length;
    const total = outcome.itemResults.length;
    const xpEarned = BASE_ROUND_XP + (total > 0 && correct === total ? PERFECT_ROUND_BONUS_XP : 0);
    recordVocabRound(outcome.itemResults, xpEarned);
    setRoundWords(null);
    setRoundIndex((i) => i + 1);
    setRoundResult({ correct, total, xpEarned });
  };

  const exercise: MatchExercise | null = roundWords
    ? {
        type: 'match',
        id: `vocab-round-${roundIndex}`,
        pairs: roundWords.map((w) => ({ pt: w.pt, lu: w.lu, itemId: w.itemId })),
      }
    : null;

  return (
    <View style={styles.page}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="book" size={26} color={authColors.accentCyan} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.pageTitle}>Vocabulário</Text>
            <Text style={styles.pageSubtitle}>Revise as palavras que você já aprendeu.</Text>
          </View>
        </View>

        {pool.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={36} color={authColors.textMuted} />
              <Text style={styles.emptyTitle}>Você ainda está começando seu vocabulário.</Text>
              <Text style={styles.emptySubtitle}>Continue suas lições para desbloquear novas palavras aqui.</Text>
            </View>
          </View>
        ) : exercise ? (
          <View style={styles.card}>
            <View style={styles.directionRow}>
              <Ionicons name="swap-horizontal" size={15} color={authColors.accentCyan} />
              <Text style={styles.directionText}>
                {direction === 'pt-lu' ? 'Português → Luxemburguês' : 'Luxemburguês → Português'}
              </Text>
            </View>
            <ExerciseMatch
              key={exercise.id}
              exercise={exercise}
              onComplete={handleRoundComplete}
              firstColumn={direction === 'pt-lu' ? 'pt' : 'lu'}
            />
          </View>
        ) : roundResult ? (
          <Animated.View style={[styles.card, styles.resultCard, { opacity: fade, transform: [{ scale: fade.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>Rodada concluída!</Text>
            </View>
            <View style={styles.resultIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
            </View>
            <Text style={styles.resultTitle}>Muito bem!</Text>
            <Text style={styles.resultSubtitle}>Você combinou todas as palavras.</Text>
            <View style={styles.resultStatsRow}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValue}>
                  {roundResult.correct}/{roundResult.total}
                </Text>
                <Text style={styles.resultStatLabel}>combinações corretas</Text>
              </View>
              <View style={styles.resultStatDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatValueXp}>+{roundResult.xpEarned}</Text>
                <Text style={styles.resultStatLabel}>XP</Text>
              </View>
            </View>
            <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]} onPress={startRound}>
              <Text style={styles.ctaButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.card}>
            {pool.length < ROUND_SIZE && (
              <View style={styles.hintBanner}>
                <Ionicons name="information-circle" size={18} color={authColors.accentCyan} />
                <Text style={styles.hintBannerText}>
                  Você ainda está começando seu vocabulário. Continue suas lições para desbloquear novas palavras.
                </Text>
              </View>
            )}
            <View style={styles.introIconWrap}>
              <Ionicons name="shuffle" size={26} color={authColors.accentCyan} />
            </View>
            <Text style={styles.introTitle}>Combinar palavras</Text>
            <Text style={styles.introSubtitle}>Relacione cada palavra em português com sua tradução em luxemburguês.</Text>
            <View style={styles.introMetaRow}>
              <Ionicons name="albums-outline" size={14} color={authColors.textSecondary} />
              <Text style={styles.introMetaText}>
                {Math.min(pool.length, ROUND_SIZE)} {Math.min(pool.length, ROUND_SIZE) === 1 ? 'par' : 'pares'} nesta rodada · {' '}
                {direction === 'pt-lu' ? 'Português → Luxemburguês' : 'Luxemburguês → Português'}
              </Text>
            </View>
            <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]} onPress={startRound}>
              <Text style={styles.ctaButtonText}>Iniciar rodada</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg },
    scroll: { flex: 1 },
    content: { padding: 28, paddingBottom: 60, maxWidth: 720, width: '100%', alignSelf: 'center' },

    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
    headerIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTextWrap: { flex: 1 },
    pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 28, color: authColors.textPrimary },
    pageSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 13.5, color: authColors.textSecondary, marginTop: 4 },

    card: {
      backgroundColor: authColors.cardBg,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 24,
      padding: 24,
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.18,
      shadowRadius: 30,
      elevation: 6,
    },

    emptyState: { alignItems: 'center', paddingVertical: 30, gap: 10 },
    emptyTitle: { fontFamily: fontFamilies.displayBold, fontSize: 16, color: authColors.textPrimary, textAlign: 'center' },
    emptySubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 13.5, color: authColors.textSecondary, textAlign: 'center' },

    hintBanner: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
      borderRadius: 14,
      padding: 14,
      marginBottom: 20,
      alignItems: 'flex-start',
    },
    hintBannerText: { flex: 1, fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, lineHeight: 18 },

    introIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(56, 189, 248, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: 16,
    },
    introTitle: { fontFamily: fontFamilies.displayBold, fontSize: 19, color: authColors.textPrimary, textAlign: 'center' },
    introSubtitle: {
      fontFamily: fontFamilies.displayRegular,
      fontSize: 13.5,
      color: authColors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 19,
    },
    introMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, marginBottom: 22 },
    introMetaText: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary },

    directionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 },
    directionText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.accentCyan },

    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      alignSelf: 'center',
      backgroundColor: authColors.accentCyan,
      borderRadius: 16,
      paddingVertical: 15,
      paddingHorizontal: 32,
    },
    ctaButtonPressed: { opacity: 0.85 },
    ctaButtonText: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: '#FFFFFF' },

    resultCard: { alignItems: 'center' },
    resultBadge: {
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(34, 197, 94, 0.35)',
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 14,
      marginBottom: 16,
    },
    resultBadgeText: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: '#4ADE80',
    },
    resultIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(34, 197, 94, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    resultTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 22, color: authColors.textPrimary },
    resultSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary, marginTop: 4 },
    resultStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
      marginTop: 24,
      marginBottom: 26,
      backgroundColor: authColors.inputBg,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 28,
    },
    resultStat: { alignItems: 'center' },
    resultStatDivider: { width: 1, height: 32, backgroundColor: authColors.divider },
    resultStatValue: { fontFamily: fontFamilies.displayExtraBold, fontSize: 20, color: authColors.textPrimary },
    resultStatValueXp: { fontFamily: fontFamilies.displayExtraBold, fontSize: 20, color: '#FFD65A' },
    resultStatLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 11.5, color: authColors.textSecondary, marginTop: 4 },
  });
}
