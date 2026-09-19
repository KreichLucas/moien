import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { AuthStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useHoverGuard } from '../utils/useHoverGuard';
import { AuthLayout } from './AuthLayout';
import { authColors, liftStyle, makeAuthStyles } from './authStyles';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithGoogle, authError, clearAuthError } = useAuth();
  const styles = useMemo(() => makeAuthStyles(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [eyeHovered, setEyeHovered] = useState(false);
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [googleHovered, setGoogleHovered] = useState(false);
  const isHoverReady = useHoverGuard();

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

  const handleGoogleSignIn = async () => {
    clearAuthError();
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // authError já foi definido pelo AuthContext
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const isDisabled = isSubmitting || !email || !password;

  return (
    <AuthLayout>
      {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
      <Image source={require('../../assets/moien-logo-3d.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.tagline}>Aprenda Luxemburguês{'\n'}de um jeito real</Text>

      <Text style={styles.welcomeTitle}>Bem-vindo! 👋</Text>
      <Text style={styles.welcomeSubtitle}>Entre para continuar aprendendo luxemburguês</Text>

      <View style={styles.form}>
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
            placeholder="Sua senha"
            placeholderTextColor={authColors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <Pressable
            onPress={() => setShowPassword((s) => !s)}
            onHoverIn={() => isHoverReady() && setEyeHovered(true)}
            onHoverOut={() => setEyeHovered(false)}
            style={({ pressed }) => liftStyle(eyeHovered, pressed)}
            hitSlop={8}
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={authColors.textSecondary} />
          </Pressable>
        </View>

        {authError ? <Text style={styles.error}>{authError}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={isDisabled}
          onHoverIn={() => isHoverReady() && setPrimaryHovered(true)}
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
                <Text style={styles.primaryButtonText}>ENTRAR</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.linkRow}>
          <Text style={styles.linkTextMuted}>Não tem conta?</Text>
          <Pressable
            onPress={() => {
              clearAuthError();
              navigation.navigate('SignUp');
            }}
            onHoverIn={() => isHoverReady() && setLinkHovered(true)}
            onHoverOut={() => setLinkHovered(false)}
            style={({ pressed }) => liftStyle(linkHovered, pressed)}
          >
            <Text style={styles.linkText}>Criar conta</Text>
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
          onHoverIn={() => isHoverReady() && setGoogleHovered(true)}
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
