import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GLOSSARY_LU_TO_PT, GLOSSARY_PT_TO_LU } from '../content/glossary';
import { classifyTranslateError } from '../learning/errorClassification';
import { itemIdsForExercise } from '../learning/itemExtraction';
import { ITEM_REGISTRY } from '../learning/registry';
import { ErrorType, ExerciseOutcome } from '../learning/types';
import { TranslateExercise } from '../types/content';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';
import { LanguageTag } from './LanguageTag';
import { TappableSentence } from './TappableSentence';

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function severityOf(errorType: ErrorType): number {
  if (errorType === 'wrong-article') return 0;
  if (errorType === 'close-miss') return 1;
  return 2;
}

const QUASE_MESSAGES: Record<Exclude<ErrorType, 'other'>, string> = {
  'wrong-article': 'Quase! Só o artigo está errado.',
  'close-miss': 'Quase! Confira a acentuação/ortografia.',
};

export function ExerciseTranslate({
  exercise,
  onComplete,
}: {
  exercise: TranslateExercise;
  onComplete: (outcome: ExerciseOutcome) => void;
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [wordHint, setWordHint] = useState<{ word: string; gloss: string } | null>(null);

  const isCorrect = exercise.acceptedAnswers.some((a) => normalize(a) === normalize(answer));
  const errorType: ErrorType | undefined = isCorrect
    ? undefined
    : exercise.acceptedAnswers
        .map((a) => classifyTranslateError(answer, a))
        .sort((a, b) => severityOf(a) - severityOf(b))[0];
  const baseGlossary = exercise.promptLang === 'lu' ? GLOSSARY_LU_TO_PT : GLOSSARY_PT_TO_LU;
  const wordGlossary = useMemo(
    () => (exercise.wordGlosses ? { ...baseGlossary, ...exercise.wordGlosses } : baseGlossary),
    [exercise, baseGlossary]
  );

  const handleCheck = () => {
    if (answer.trim().length === 0) return;
    setChecked(true);
  };

  const handleContinue = () => {
    const itemIds = itemIdsForExercise(exercise, ITEM_REGISTRY);
    onComplete({
      itemResults: itemIds.map((itemId) => ({
        itemId,
        correct: isCorrect,
        errorType: isCorrect ? undefined : errorType,
        exerciseId: exercise.id,
        exerciseType: exercise.type,
      })),
    });
  };

  return (
    <View style={styles.container}>
      <LanguageTag lang={exercise.promptLang} />
      <Text style={styles.instruction}>Traduza a frase: (toque numa palavra pra ver uma dica)</Text>
      <View style={styles.promptWrapper}>
        <TappableSentence
          text={exercise.prompt}
          glossary={wordGlossary}
          textStyle={styles.promptText}
          activeWord={wordHint?.word ?? null}
          onWordPress={(word, gloss) => setWordHint((w) => (w?.word === word ? null : { word, gloss }))}
        />
      </View>
      {wordHint && (
        <View style={styles.wordHintBox}>
          <Text style={styles.wordHintText}>{wordHint.gloss}</Text>
        </View>
      )}

      <TextInput
        style={[
          styles.input,
          checked && (isCorrect ? styles.inputCorrect : styles.inputWrong),
        ]}
        value={answer}
        onChangeText={setAnswer}
        editable={!checked}
        placeholder="Digite sua resposta"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {checked && !isCorrect && (
        <Pressable onPress={() => exercise.hint && setShowHint((s) => !s)}>
          {errorType && errorType !== 'other' && (
            <Text style={styles.quaseText}>❌ {QUASE_MESSAGES[errorType]}</Text>
          )}
          <Text style={styles.correction}>
            Resposta correta: {exercise.acceptedAnswers[0]}
            {exercise.hint ? '  💡' : ''}
          </Text>
        </Pressable>
      )}

      {checked && !isCorrect && showHint && exercise.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{exercise.hint}</Text>
        </View>
      )}

      <View style={styles.footer}>
        {!checked ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              answer.trim().length === 0 && styles.buttonDisabled,
              answer.trim().length > 0 && pressedStyle(pressed),
            ]}
            disabled={answer.trim().length === 0}
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
    instruction: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
    promptWrapper: { marginBottom: 12 },
    promptText: { fontSize: 26, fontWeight: '700', color: colors.text },
    wordHintBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    wordHintText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    input: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 17,
      color: colors.text,
    },
    inputCorrect: { borderColor: colors.correctBorder, backgroundColor: colors.correctBg },
    inputWrong: { borderColor: colors.wrongBorder, backgroundColor: colors.wrongBg },
    correction: { marginTop: 10, color: colors.danger, fontWeight: '600' },
    quaseText: { marginTop: 10, color: colors.accent, fontWeight: '700' },
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
