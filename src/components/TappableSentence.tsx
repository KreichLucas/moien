import React, { useMemo, useRef, useState } from 'react';
import { LayoutRectangle, Pressable, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { normalizeWord } from '../content/glossary';
import { ThemeColors, useTheme } from '../theme/theme';

export function TappableSentence({
  text,
  glossary,
  textStyle,
}: {
  text: string;
  glossary: Record<string, string>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);
  const layouts = useRef<Record<number, LayoutRectangle>>({});
  const [active, setActive] = useState<{ index: number; gloss: string; layout: LayoutRectangle } | null>(null);

  return (
    <View style={styles.wrapper}>
      {active && (
        <View
          style={[
            styles.tooltip,
            { left: Math.max(0, active.layout.x - 4), top: active.layout.y - 40 },
          ]}
        >
          <Text style={styles.tooltipText}>{active.gloss}</Text>
        </View>
      )}
      <View style={styles.row}>
        {tokens.map((token, index) => {
          if (/^\s+$/.test(token)) {
            return (
              <Text key={index} style={[styles.word, textStyle]}>
                {token}
              </Text>
            );
          }
          const gloss = glossary[normalizeWord(token)];
          const isActive = active?.index === index;
          return (
            <Pressable
              key={index}
              onLayout={(e) => {
                layouts.current[index] = e.nativeEvent.layout;
              }}
              onPress={() => {
                if (!gloss) return;
                const layout = layouts.current[index];
                if (!layout) return;
                setActive(isActive ? null : { index, gloss, layout });
              }}
            >
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
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { position: 'relative' },
    row: { flexDirection: 'row', flexWrap: 'wrap' },
    word: {},
    wordHintable: {
      textDecorationLine: 'underline',
      textDecorationStyle: 'dotted',
      textDecorationColor: colors.accent,
    },
    wordActive: { color: colors.accent },
    tooltip: {
      position: 'absolute',
      backgroundColor: colors.text,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      maxWidth: 220,
      zIndex: 10,
    },
    tooltipText: { color: colors.background, fontSize: 13, fontWeight: '600' },
  });
}
