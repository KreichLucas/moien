import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OutOfDiamonds'>;

export function OutOfDiamondsScreen({ route, navigation }: Props) {
  const { lessonId } = route.params;
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handlePractice = () => {
    navigation.replace('DiamondRecovery', { lessonId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💎</Text>
      <Text style={styles.title}>Você ficou sem diamantes!</Text>
      <Text style={styles.subtitle}>Pratique os itens que você errou para recuperar seus diamantes.</Text>

      <Pressable style={({ pressed }) => [styles.button, pressedStyle(pressed)]} onPress={handlePractice}>
        <Text style={styles.buttonText}>PRATICAR AGORA</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emoji: { fontSize: 72, marginBottom: 16 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 36 },
    button: {
      width: '100%',
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      ...cardShadow(colors),
    },
    buttonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  });
}
