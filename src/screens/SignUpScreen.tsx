import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { pressedStyle, useTheme } from '../theme/theme';
import { makeAuthStyles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, authError, clearAuthError } = useAuth();
  const colors = useTheme();
  const styles = useMemo(() => makeAuthStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    clearAuthError();
    setLocalError(null);

    if (password.length < 6) {
      setLocalError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password);
    } catch {
      // authError já foi definido pelo AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorText = localError ?? authError;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>
      <Text style={styles.subtitle}>Seu progresso fica salvo só para você</Text>

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
          placeholder="Senha (mínimo 6 caracteres)"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar senha"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressedStyle(pressed), isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || !email || !password || !confirmPassword}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.buttonTextOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>CRIAR CONTA</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.linkRow}
          onPress={() => {
            clearAuthError();
            navigation.navigate('Login');
          }}
        >
          <Text style={styles.linkText}>Já tem conta? Entrar</Text>
        </Pressable>
      </View>
    </View>
  );
}
