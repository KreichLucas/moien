import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { ThemeColors, useTheme } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export function ResultScreen({ route, navigation }: Props) {
  const { xpEarned, correctCount, totalCount } = route.params;
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleContinue = () => navigation.popToTop();

  return (
    <View style={[styles.container, { backgroundColor: colors.correctBg }]}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Lição completa!</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {xpEarned}</Text>
          <Text style={styles.statLabel}>XP ganho</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {correctCount}/{totalCount}
          </Text>
          <Text style={styles.statLabel}>Acertos</Text>
        </View>
      </View>

      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleContinue}>
        <Text style={styles.buttonText}>CONTINUAR</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emoji: { fontSize: 72, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 24, textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 40, width: '100%' },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 16, padding: 20, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 13, color: colors.text, opacity: 0.7, marginTop: 4 },
    button: { width: '100%', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 'auto' },
    buttonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
  });
}
