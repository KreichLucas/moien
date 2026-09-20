import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GLOSSARY_LU_TO_PT, GLOSSARY_PT_TO_LU } from '../content/glossary';
import { itemIdsForExercise } from '../learning/itemExtraction';
import { ITEM_REGISTRY } from '../learning/registry';
import { ExerciseOutcome } from '../learning/types';
import { MultipleChoiceExercise } from '../types/content';
import { ThemeColors, cardShadow, pressedStyle } from '../theme/theme';
import { lessonColors } from '../screens/lessonStyles';
import { LanguageTag } from './LanguageTag';
import { TappableSentence } from './TappableSentence';

export function ExerciseMultipleChoice({
  exercise,
  onComplete,
}: {
  exercise: MultipleChoiceExercise;
  onComplete: (outcome: ExerciseOutcome) => void;
}) {
  const colors = lessonColors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wordHint, setWordHint] = useState<{ word: string; gloss: string } | null>(null);

  const isCorrect = selected === exercise.correctIndex;
  const wrongAndChecked = checked && !isCorrect;
  const baseGlossary = exercise.promptLang === 'lu' ? GLOSSARY_LU_TO_PT : GLOSSARY_PT_TO_LU;
  const wordGlossary = useMemo(
    () => (exercise.wordGlosses ? { ...baseGlossary, ...exercise.wordGlosses } : baseGlossary),
    [exercise, baseGlossary]
  );

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
  };

  // Best-effort TTS, same approach as the dashboard's phrase-of-day audio
  // button — most browsers don't ship a real Luxembourgish voice, so this
  // reads with an approximate accent rather than perfect pronunciation.
  const handlePlayPrompt = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(exercise.prompt);
      utterance.lang = exercise.promptLang === 'lu' ? 'lb-LU' : 'pt-PT';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
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
      <Text style={styles.instruction}>
        {exercise.promptLang === 'lu' ? 'Qual é a tradução de:' : 'Qual é a tradução em luxemburguês de:'}
      </Text>
      <View style={styles.promptCard}>
        <View style={styles.promptWrapper}>
          <TappableSentence
            text={exercise.prompt}
            glossary={wordGlossary}
            textStyle={styles.promptText}
            activeWord={wordHint?.word ?? null}
            onWordPress={(word, gloss) => setWordHint((w) => (w?.word === word ? null : { word, gloss }))}
          />
        </View>
        <Pressable onPress={handlePlayPrompt} style={({ pressed }) => [styles.audioButton, pressedStyle(pressed)]} hitSlop={8}>
          <Ionicons name="volume-high" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      {wordHint && (
        <View style={styles.wordHintBox}>
          <Text style={styles.wordHintText}>{wordHint.gloss}</Text>
        </View>
      )}

      {exercise.options.map((option, index) => {
        const isSelected = selected === index;
        const isWrongSelected = checked && isSelected && !isCorrect;
        let optionStyle = null;
        if (checked && isSelected) {
          optionStyle = isCorrect ? styles.optionCorrect : styles.optionWrong;
        } else if (checked && index === exercise.correctIndex) {
          optionStyle = styles.optionCorrect;
        } else if (isSelected) {
          optionStyle = styles.optionSelected;
        }
        const letter = String.fromCharCode(65 + index);
        return (
          <Pressable
            key={index}
            style={[styles.option, optionStyle]}
            disabled={checked && !isWrongSelected}
            onPress={() => {
              if (!checked) {
                setSelected(index);
              } else if (isWrongSelected) {
                setShowHint((s) => !s);
              }
            }}
          >
            <View style={[styles.optionLetter, (isSelected || (checked && index === exercise.correctIndex)) && styles.optionLetterActive]}>
              <Text style={[styles.optionLetterText, (isSelected || (checked && index === exercise.correctIndex)) && styles.optionLetterTextActive]}>
                {letter}
              </Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionText}>{option}</Text>
              {isWrongSelected && exercise.hint && (
                <Text style={styles.hintTap}>{showHint ? 'toque para ocultar a dica 💡' : 'toque para ver a dica 💡'}</Text>
              )}
            </View>
          </Pressable>
        );
      })}

      {wrongAndChecked && showHint && exercise.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{exercise.hint}</Text>
        </View>
      )}

      <View style={styles.footer}>
        {!checked ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              selected === null && styles.buttonDisabled,
              selected !== null && pressedStyle(pressed),
            ]}
            disabled={selected === null}
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
    instruction: { fontSize: 15, color: colors.textSecondary, marginBottom: 14, textAlign: 'center' },
    promptCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    promptWrapper: { flex: 1 },
    promptText: { fontSize: 26, fontWeight: '700', color: colors.text },
    audioButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordHintBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
    },
    wordHintText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    optionSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.selectedBg },
    optionCorrect: { borderColor: colors.correctBorder, backgroundColor: colors.correctBg },
    optionWrong: { borderColor: colors.wrongBorder, backgroundColor: colors.wrongBg },
    optionLetter: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionLetterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionLetterText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    optionLetterTextActive: { color: colors.buttonTextOnPrimary },
    optionContent: { flex: 1 },
    optionText: { fontSize: 17, color: colors.text },
    hintTap: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: 6 },
    hintBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
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
