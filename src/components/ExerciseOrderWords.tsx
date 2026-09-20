import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { itemIdsForExercise } from '../learning/itemExtraction';
import { ITEM_REGISTRY } from '../learning/registry';
import { ExerciseOutcome } from '../learning/types';
import { OrderWordsExercise } from '../types/content';
import { ThemeColors, cardShadow, pressedStyle } from '../theme/theme';
import { lessonColors } from '../screens/lessonStyles';
import { shuffle } from '../utils/shuffle';

export function ExerciseOrderWords({
  exercise,
  onComplete,
}: {
  exercise: OrderWordsExercise;
  onComplete: (outcome: ExerciseOutcome) => void;
}) {
  const colors = lessonColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const bank = useMemo(() => shuffle(exercise.words), [exercise]);

  const [chosen, setChosen] = useState<number[]>([]); // indexes into `bank`
  const [checked, setChecked] = useState(false);

  const chosenWords = chosen.map((i) => bank[i]);
  const isCorrect = checked && chosenWords.join('|') === exercise.correctOrder.join('|');

  const pickWord = (bankIndex: number) => {
    if (checked || chosen.includes(bankIndex)) return;
    setChosen((prev) => [...prev, bankIndex]);
  };

  const removeAt = (chosenIndex: number) => {
    if (checked) return;
    setChosen((prev) => prev.filter((_, i) => i !== chosenIndex));
  };

  const handleCheck = () => {
    if (chosen.length !== exercise.words.length) return;
    setChecked(true);
  };

  const handleContinue = () => {
    const itemIds = itemIdsForExercise(exercise, ITEM_REGISTRY);
    onComplete({
      itemResults: itemIds.map((itemId) => ({
        itemId,
        correct: isCorrect,
        errorType: isCorrect ? undefined : 'other',
        exerciseId: exercise.id,
        exerciseType: exercise.type,
      })),
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Ordene as palavras para formar a frase:</Text>
      <Text style={styles.translation}>{exercise.translation}</Text>

      <View style={[styles.slotRow, checked && (isCorrect ? styles.slotRowCorrect : styles.slotRowWrong)]}>
        {chosen.length === 0 ? (
          <Text style={styles.slotPlaceholder}>Toque nas palavras abaixo</Text>
        ) : (
          chosenWords.map((word, i) => (
            <Pressable key={i} style={styles.slotChip} onPress={() => removeAt(i)} disabled={checked}>
              <Text style={styles.slotChipText}>{word}</Text>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.bank}>
        {bank.map((word, i) => {
          const used = chosen.includes(i);
          return (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.chip, used && styles.chipUsed, !used && pressedStyle(pressed)]}
              disabled={used || checked}
              onPress={() => pickWord(i)}
            >
              <Text style={[styles.chipText, used && styles.chipTextUsed]}>{word}</Text>
            </Pressable>
          );
        })}
      </View>

      {checked && !isCorrect && (
        <Text style={styles.correction}>Ordem correta: {exercise.correctOrder.join(' ')}</Text>
      )}
      {checked && exercise.hint && <Text style={styles.hintText}>💡 {exercise.hint}</Text>}

      <View style={styles.footer}>
        {!checked ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              chosen.length !== exercise.words.length && styles.buttonDisabled,
              chosen.length === exercise.words.length && pressedStyle(pressed),
            ]}
            disabled={chosen.length !== exercise.words.length}
            onPress={handleCheck}
          >
            <Text style={styles.buttonText}>VERIFICAR</Text>
          </Pressable>
        ) : (
          <Pressable style={({ pressed }) => [styles.button, pressedStyle(pressed)]} onPress={handleContinue}>
            <Text style={styles.buttonText}>CONTINUAR</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20 },
    instruction: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
    translation: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20 },
    slotRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      minHeight: 56,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      alignItems: 'center',
    },
    slotRowCorrect: { borderColor: colors.correctBorder, backgroundColor: colors.correctBg },
    slotRowWrong: { borderColor: colors.wrongBorder, backgroundColor: colors.wrongBg },
    slotPlaceholder: { color: colors.textSecondary, fontSize: 14 },
    slotChip: {
      backgroundColor: colors.selectedBg,
      borderWidth: 2,
      borderColor: colors.selectedBorder,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    slotChipText: { fontSize: 16, fontWeight: '700', color: colors.text },
    bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
      ...cardShadow(colors),
    },
    chipUsed: { opacity: 0.3 },
    chipText: { fontSize: 16, color: colors.text, fontWeight: '600' },
    chipTextUsed: { color: colors.textSecondary },
    correction: { marginTop: 16, color: colors.danger, fontWeight: '600' },
    hintText: { marginTop: 10, fontSize: 14, color: colors.text, lineHeight: 20 },
    footer: { marginTop: 'auto' },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      ...cardShadow(colors),
    },
    buttonDisabled: { backgroundColor: colors.locked },
    buttonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  });
}
