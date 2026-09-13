import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MultipleChoiceExercise } from '../types/content';
import { ThemeColors, useTheme } from '../theme/theme';
import { LanguageTag } from './LanguageTag';

export function ExerciseMultipleChoice({
  exercise,
  onComplete,
}: {
  exercise: MultipleChoiceExercise;
  onComplete: (hadMistake: boolean) => void;
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = selected === exercise.correctIndex;
  const wrongAndChecked = checked && !isCorrect;

  const handleCheck = () => {
    if (selected === null) return;
    setChecked(true);
  };

  const handleContinue = () => {
    onComplete(!isCorrect);
  };

  return (
    <View style={styles.container}>
      <LanguageTag lang={exercise.promptLang} />
      <Text style={styles.prompt}>{exercise.prompt}</Text>

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
            <Text style={styles.optionText}>{option}</Text>
            {isWrongSelected && exercise.hint && (
              <Text style={styles.hintTap}>{showHint ? 'toque para ocultar a dica 💡' : 'toque para ver a dica 💡'}</Text>
            )}
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
            style={[styles.button, selected === null && styles.buttonDisabled]}
            disabled={selected === null}
            onPress={handleCheck}
          >
            <Text style={styles.buttonText}>VERIFICAR</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.button} onPress={handleContinue}>
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
    prompt: { fontSize: 26, fontWeight: '700', marginBottom: 24, color: colors.text },
    option: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    optionSelected: { borderColor: colors.selectedBorder, backgroundColor: colors.selectedBg },
    optionCorrect: { borderColor: colors.correctBorder, backgroundColor: colors.correctBg },
    optionWrong: { borderColor: colors.wrongBorder, backgroundColor: colors.wrongBg },
    optionText: { fontSize: 17, color: colors.text },
    hintTap: { fontSize: 12, color: colors.accent, fontWeight: '600', marginTop: 6 },
    hintBox: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    hintText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    footer: { marginTop: 'auto' },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonDisabled: { backgroundColor: colors.locked },
    buttonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  });
}
