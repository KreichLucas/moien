import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { AuthLayout } from './AuthLayout';
import { authColors, liftStyle, makeAuthStyles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signUp, signInWithGoogle, authError, clearAuthError } = useAuth();
  const styles = useMemo(() => makeAuthStyles(), []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [eyeHovered, setEyeHovered] = useState(false);
  const [confirmEyeHovered, setConfirmEyeHovered] = useState(false);
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [googleHovered, setGoogleHovered] = useState(false);

  const handleSubmit = async () => {
    clearAuthError();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('Digite seu nome.');
      return;
    }
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
      await signUp(email.trim(), password, name.trim());
    } catch {
      // authError já foi definido pelo AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setLocalError(null);
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // authError já foi definido pelo AuthContext
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const errorText = localError ?? authError;
  const isDisabled = isSubmitting || !name || !email || !password || !confirmPassword;

  return (
    <AuthLayout>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require('../../assets/moien-logo-3d.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tagline}>Aprenda Luxemburguês{'\n'}de um jeito real</Text>

      <Text style={styles.welcomeTitle}>Criar conta</Text>
      <Text style={styles.welcomeSubtitle}>Seu progresso fica salvo só para você</Text>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={18} color={authColors.textSecondary} />
          <TextInput
            style={styles.inputField}
            placeholder="Seu nome"
            placeholderTextColor={authColors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color={authColors.textSecondary} />
          <TextInput
            style={styles.inputField}
            placeholder="Seu e-mail"
            placeholderTextColor={authColors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={authColors.textSecondary} />
          <TextInput
            style={styles.inputField}
            placeholder="Senha (mínimo 6 caracteres)"
            placeholderTextColor={authColors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password-new"
          />
          <Pressable
            onPress={() => setShowPassword((s) => !s)}
            onHoverIn={() => setEyeHovered(true)}
            onHoverOut={() => setEyeHovered(false)}
            style={({ pressed }) => liftStyle(eyeHovered, pressed)}
            hitSlop={8}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={authColors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={authColors.textSecondary} />
          <TextInput
            style={styles.inputField}
            placeholder="Confirmar senha"
            placeholderTextColor={authColors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoComplete="password-new"
          />
          <Pressable
            onPress={() => setShowConfirmPassword((s) => !s)}
            onHoverIn={() => setConfirmEyeHovered(true)}
            onHoverOut={() => setConfirmEyeHovered(false)}
            style={({ pressed }) => liftStyle(confirmEyeHovered, pressed)}
            hitSlop={8}
          >
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={authColors.textSecondary} />
          </Pressable>
        </View>

        {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={isDisabled}
          onHoverIn={() => setPrimaryHovered(true)}
          onHoverOut={() => setPrimaryHovered(false)}
          style={({ pressed }) => [!isDisabled && liftStyle(primaryHovered, pressed), isDisabled && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={[authColors.accentCyan, authColors.accentBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>CRIAR CONTA</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.linkRow}>
          <Text style={styles.linkTextMuted}>Já tem conta?</Text>
          <Pressable
            onPress={() => {
              clearAuthError();
              navigation.navigate('Login');
            }}
            onHoverIn={() => setLinkHovered(true)}
            onHoverOut={() => setLinkHovered(false)}
            style={({ pressed }) => liftStyle(linkHovered, pressed)}
          >
            <Text style={styles.linkText}>Entrar</Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.socialButton, liftStyle(googleHovered, pressed), isGoogleSubmitting && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          onHoverIn={() => setGoogleHovered(true)}
          onHoverOut={() => setGoogleHovered(false)}
          disabled={isGoogleSubmitting}
        >
          {isGoogleSubmitting ? (
            <ActivityIndicator color={authColors.textPrimary} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={authColors.textPrimary} />
              <Text style={styles.socialButtonText}>Continuar com Google</Text>
            </>
          )}
        </Pressable>

        <View style={styles.benefitsRow}>
          <View style={styles.benefitItem}>
            <Ionicons name="bar-chart-outline" size={20} color={authColors.accentCyan} />
            <Text style={styles.benefitText}>Pequenos passos{'\n'}Grandes resultados</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={authColors.accentCyan} />
            <Text style={styles.benefitText}>Aprendizado{'\n'}seguro e eficiente</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="people-outline" size={20} color={authColors.accentCyan} />
            <Text style={styles.benefitText}>Junte-se a uma{'\n'}comunidade global</Text>
          </View>
        </View>
      </View>
    </AuthLayout>
  );
}
