import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GLOSSARY_LU_TO_PT, GLOSSARY_PT_TO_LU } from '../content/glossary';
import { itemIdsForExercise } from '../learning/itemExtraction';
import { ITEM_REGISTRY } from '../learning/registry';
import { ExerciseOutcome } from '../learning/types';
import { FillBlankExercise } from '../types/content';
import { ThemeColors, cardShadow, pressedStyle } from '../theme/theme';
import { lessonColors } from '../screens/lessonStyles';
import { LanguageTag } from './LanguageTag';
import { TappableSentence } from './TappableSentence';
import { shuffle } from '../utils/shuffle';

export function ExerciseFillBlank({
  exercise,
  onComplete,
}: {
  exercise: FillBlankExercise;
  onComplete: (outcome: ExerciseOutcome) => void;
}) {
  const colors = lessonColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const wordBank = useMemo(() => shuffle(exercise.options), [exercise]);

  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wordHint, setWordHint] = useState<{ word: string; gloss: string } | null>(null);

  const isCorrect = selected === exercise.correctAnswer;
  const wrongAndChecked = checked && !isCorrect;

  const [before, after] = exercise.sentence.split('___');
  const baseGlossary = exercise.promptLang === 'lu' ? GLOSSARY_LU_TO_PT : GLOSSARY_PT_TO_LU;
  const wordGlossary = useMemo(
    () => (exercise.wordGlosses ? { ...baseGlossary, ...exercise.wordGlosses } : baseGlossary),
    [exercise, baseGlossary]
  );

  const handleCheck = () => {
    if (!selected) return;
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
      <LanguageTag lang={exercise.promptLang} />
      <Text style={styles.instruction}>Complete a frase:</Text>
      <Text style={styles.translation}>{exercise.translation}</Text>

      <View style={styles.sentenceRow}>
        <TappableSentence
          text={before}
          glossary={wordGlossary}
          textStyle={styles.sentence}
          activeWord={wordHint?.word ?? null}
          onWordPress={(word, gloss) => setWordHint((w) => (w?.word === word ? null : { word, gloss }))}
        />
        <View
          style={[
            styles.blank,
            checked && (isCorrect ? styles.blankCorrect : styles.blankWrong),
          ]}
        >
          <Text style={styles.blankText}>{selected ?? ''}</Text>
        </View>
        <TappableSentence
          text={after}
          glossary={wordGlossary}
          textStyle={styles.sentence}
          activeWord={wordHint?.word ?? null}
          onWordPress={(word, gloss) => setWordHint((w) => (w?.word === word ? null : { word, gloss }))}
        />
      </View>
      {wordHint && (
        <View style={styles.wordHintBox}>
          <Text style={styles.wordHintText}>{wordHint.gloss}</Text>
        </View>
      )}

      <View style={styles.bank}>
        {wordBank.map((word) => {
          const isSelected = selected === word;
          const isWrongSelected = checked && isSelected && !isCorrect;
          let chipStyle = null;
          if (checked && isSelected) {
            chipStyle = isCorrect ? styles.chipCorrect : styles.chipWrong;
          } else if (isSelected) {
            chipStyle = styles.chipSelected;
          }
          return (
            <Pressable
              key={word}
              style={[styles.chip, chipStyle]}
              disabled={checked && !isWrongSelected}
              onPress={() => {
                if (!checked) {
                  setSelected(word);
                } else if (isWrongSelected) {
                  setShowHint((s) => !s);
                }
              }}
            >
              <Text style={styles.chipText}>{word}</Text>
            </Pressable>
          );
        })}
      </View>

      {wrongAndChecked && exercise.hint && (
        <Text style={styles.hintTap} onPress={() => setShowHint((s) => !s)}>
          {showHint ? 'toque para ocultar a dica 💡' : 'toque para ver a dica 💡'}
        </Text>
      )}
      {wrongAndChecked && showHint && exercise.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{exercise.hint}</Text>
        </View>
      )}

      <View style={styles.footer}>
        {!checked ? (
          <Pressable
            style={({ pressed }) => [styles.button, !selected && styles.buttonDisabled, !!selected && pressedStyle(pressed)]}
            disabled={!selected}
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
    translation: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, fontStyle: 'italic' },
    sentenceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 },
    sentence: { fontSize: 22, fontWeight: '700', color: colors.text },
    wordHintBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
    },
    wordHintText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    blank: {
      minWidth: 70,
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
      marginHorizontal: 4,
      paddingHorizontal: 4,
      paddingBottom: 2,
      alignItems: 'center',
    },
    blankCorrect: { borderBottomColor: colors.correctBorder },
    blankWrong: { borderBottomColor: colors.wrongBorder },
    blankText: { fontSize: 22, fontWeight: '700', color: colors.accent },
    bank: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    chipSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.selectedBg },
    chipCorrect: { borderColor: colors.correctBorder, backgroundColor: colors.correctBg },
    chipWrong: { borderColor: colors.wrongBorder, backgroundColor: colors.wrongBg },
    chipText: { fontSize: 16, color: colors.text, fontWeight: '600' },
    hintTap: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: 16 },
    hintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginTop: 10,
    },
    hintText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
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
