import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { pressedStyle, useTheme } from '../theme/theme';
import { makeAuthStyles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, authError, clearAuthError } = useAuth();
  const colors = useTheme();
  const styles = useMemo(() => makeAuthStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    clearAuthError();
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      // authError já foi definido pelo AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Moien! 👋</Text>
      <Text style={styles.subtitle}>Entre para continuar aprendendo luxemburguês</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressedStyle(pressed), isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !email || !password}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.buttonTextOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>ENTRAR</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.linkRow}
          onPress={() => {
            clearAuthError();
            navigation.navigate('SignUp');
          }}
        >
          <Text style={styles.linkText}>Não tem conta? Criar conta</Text>
        </Pressable>
      </View>
    </View>
  );
}
