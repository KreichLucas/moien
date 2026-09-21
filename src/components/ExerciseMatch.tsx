import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ITEM_REGISTRY } from '../learning/registry';
import { ExerciseOutcome } from '../learning/types';
import { MatchExercise } from '../types/content';
import { ThemeColors } from '../theme/theme';
import { lessonColors } from '../screens/lessonStyles';
import { shuffle } from '../utils/shuffle';

export function ExerciseMatch({
  exercise,
  onComplete,
  firstColumn = 'pt',
}: {
  exercise: MatchExercise;
  onComplete: (outcome: ExerciseOutcome) => void;
  /** Which language's column renders on the left — every real lesson leaves this at the default 'pt'; only Vocabulário's round-direction alternation passes 'lu'. */
  firstColumn?: 'pt' | 'lu';
}) {
  const colors = lessonColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const ptWords = useMemo(() => shuffle(exercise.pairs.map((p) => p.pt)), [exercise]);
  const luWords = useMemo(() => shuffle(exercise.pairs.map((p) => p.lu)), [exercise]);
  const correctMap = useMemo(() => {
    const map: Record<string, string> = {};
    exercise.pairs.forEach((p) => (map[p.pt] = p.lu));
    return map;
  }, [exercise]);

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedPt, setSelectedPt] = useState<string | null>(null);
  const [selectedLu, setSelectedLu] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<{ pt: string; lu: string } | null>(null);
  const [mistakeHint, setMistakeHint] = useState<string | null>(null);
  const wrongPts = useRef<Set<string>>(new Set());

  const isDone = matched.size === exercise.pairs.length * 2;

  React.useEffect(() => {
    if (isDone) {
      const timeout = setTimeout(() => {
        onComplete({
          itemResults: exercise.pairs
            .map((pair, i) => {
              // Real lesson content always resolves through the registry
              // (built once from units.ts at load time); a pair's own
              // `itemId` is otherwise unset there and only used as a
              // fallback here for a synthetically-built MatchExercise —
              // e.g. Vocabulário's matching round, which has no fixed
              // exercise id of its own for the registry to have indexed.
              const itemId = ITEM_REGISTRY.exerciseToItemIds[`${exercise.id}#${i}`]?.[0] ?? pair.itemId;
              if (!itemId) return null;
              const correct = !wrongPts.current.has(pair.pt);
              return {
                itemId,
                correct,
                errorType: correct ? undefined : ('other' as const),
                exerciseId: exercise.id,
                exerciseType: exercise.type,
              };
            })
            .filter((r): r is NonNullable<typeof r> => r !== null),
        });
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isDone]);

  const tryMatch = (pt: string | null, lu: string | null) => {
    if (!pt || !lu) return;
    if (correctMap[pt] === lu) {
      setMatched((prev) => new Set(prev).add(pt).add(lu));
      setSelectedPt(null);
      setSelectedLu(null);
      setMistakeHint(null);
    } else {
      wrongPts.current.add(pt);
      setWrongPair({ pt, lu });
      const hint = exercise.pairs.find((p) => p.pt === pt)?.hint;
      if (hint) setMistakeHint(hint);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedPt(null);
        setSelectedLu(null);
      }, 400);
    }
  };

  const handlePickPt = (word: string) => {
    if (matched.has(word) || wrongPair) return;
    setSelectedPt(word);
    tryMatch(word, selectedLu);
  };

  const handlePickLu = (word: string) => {
    if (matched.has(word) || wrongPair) return;
    setSelectedLu(word);
    tryMatch(selectedPt, word);
  };

  const cardStyle = (word: string, isPt: boolean) => {
    if (matched.has(word)) return styles.cardMatched;
    if (wrongPair && ((isPt && wrongPair.pt === word) || (!isPt && wrongPair.lu === word))) {
      return styles.cardWrong;
    }
    if ((isPt && selectedPt === word) || (!isPt && selectedLu === word)) return styles.cardSelected;
    return null;
  };

  const ptColumn = (
    <View style={styles.column}>
      {ptWords.map((word) => (
        <Pressable
          key={word}
          style={[styles.card, cardStyle(word, true)]}
          disabled={matched.has(word)}
          onPress={() => handlePickPt(word)}
        >
          <Text style={styles.cardText}>{word}</Text>
        </Pressable>
      ))}
    </View>
  );
  const luColumn = (
    <View style={styles.column}>
      {luWords.map((word) => (
        <Pressable
          key={word}
          style={[styles.card, cardStyle(word, false)]}
          disabled={matched.has(word)}
          onPress={() => handlePickLu(word)}
        >
          <Text style={styles.cardText}>{word}</Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Associe as palavras em português e luxemburguês</Text>
      <View style={styles.columns}>
        {firstColumn === 'pt' ? (
          <>
            {ptColumn}
            {luColumn}
          </>
        ) : (
          <>
            {luColumn}
            {ptColumn}
          </>
        )}
      </View>

      {mistakeHint && (
        <Pressable style={styles.hintBox} onPress={() => setMistakeHint(null)}>
          <Text style={styles.hintText}>💡 {mistakeHint}</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20 },
    instruction: { fontSize: 16, color: colors.text, marginBottom: 20, fontWeight: '600' },
    columns: { flexDirection: 'row', gap: 12 },
    column: { flex: 1, gap: 10 },
    card: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    cardSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.selectedBg },
    cardMatched: { borderColor: colors.correctBorder, backgroundColor: colors.correctBg, opacity: 0.5 },
    cardWrong: { borderColor: colors.wrongBorder, backgroundColor: colors.wrongBg },
    cardText: { fontSize: 15, color: colors.text, fontWeight: '600', textAlign: 'center' },
    hintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
    },
    hintText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  });
}
