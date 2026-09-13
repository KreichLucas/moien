import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { normalizeWord } from '../content/glossary';
import { ThemeColors, useTheme } from '../theme/theme';

export function TappableSentence({
  text,
  glossary,
  textStyle,
  activeWord,
  onWordPress,
}: {
  text: string;
  glossary: Record<string, string>;
  textStyle?: StyleProp<TextStyle>;
  activeWord?: string | null;
  onWordPress: (word: string, gloss: string) => void;
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);

  return (
    <View style={styles.row}>
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token)) {
          return (
            <Text key={index} style={[styles.word, textStyle]}>
              {token}
            </Text>
          );
        }
        const key = normalizeWord(token);
        const gloss = glossary[key];
        const isActive = activeWord === key;
        return (
          <Pressable key={index} onPress={() => gloss && onWordPress(key, gloss)}>
            <Text
              style={[
                styles.word,
                textStyle,
                gloss && styles.wordHintable,
                isActive && styles.wordActive,
              ]}
            >
              {token}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap' },
    word: {},
    wordHintable: {
      textDecorationLine: 'underline',
      textDecorationStyle: 'dotted',
      textDecorationColor: colors.accent,
    },
    wordActive: { color: colors.accent },
  });
}
