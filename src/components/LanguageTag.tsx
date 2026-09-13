import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Language } from '../types/content';

export function LanguageTag({ lang }: { lang: Language }) {
  const isLu = lang === 'lu';
  return (
    <View style={[styles.tag, { backgroundColor: isLu ? '#1CB0F6' : '#FF9600' }]}>
      <Text style={styles.text}>{isLu ? 'LUXEMBURGUÊS' : 'PORTUGUÊS'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
