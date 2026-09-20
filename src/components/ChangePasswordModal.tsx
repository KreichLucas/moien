import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { mapAuthError, useAuth } from '../state/AuthContext';
import { authColors, fontFamilies } from '../screens/authStyles';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ visible, onClose }: Props) {
  const styles = useMemo(() => makeStyles(), []);
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(mapAuthError(err.code ?? '') || 'Não foi possível alterar sua senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {success ? (
            <>
              <Text style={styles.title}>Senha alterada!</Text>
              <Text style={styles.body}>Sua senha foi atualizada com sucesso.</Text>
              <Pressable style={styles.confirmButton} onPress={handleClose}>
                <Text style={styles.confirmButtonText}>Fechar</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Alterar senha</Text>
              <Text style={styles.body}>Confirme sua senha atual e escolha uma nova.</Text>

              <TextInput
                style={styles.input}
                placeholder="Senha atual"
                placeholderTextColor={authColors.textMuted}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Nova senha (mínimo 6 caracteres)"
                placeholderTextColor={authColors.textMuted}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nova senha"
                placeholderTextColor={authColors.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.confirmButton, isSubmitting && styles.confirmButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  <Text style={styles.confirmButtonText}>{isSubmitting ? 'Salvando...' : 'Salvar nova senha'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function makeStyles() {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 16, 0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    card: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: authColors.pageBgTop,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 24,
      padding: 24,
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.4,
      shadowRadius: 40,
      elevation: 12,
    },
    title: { fontFamily: fontFamilies.displayBold, fontSize: 18, color: authColors.textPrimary, textAlign: 'center', marginBottom: 6 },
    body: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary, textAlign: 'center', marginBottom: 18 },
    input: {
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.inputBorder,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 48,
      color: authColors.textPrimary,
      fontFamily: fontFamilies.displayRegular,
      fontSize: 14,
      marginBottom: 10,
    },
    error: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12.5, color: authColors.danger, marginBottom: 8, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
    cancelButton: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: authColors.inputBg,
      borderWidth: 1,
      borderColor: authColors.inputBorder,
    },
    cancelButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textPrimary },
    confirmButton: {
      flex: 1.4,
      paddingVertical: 13,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: authColors.accentBlue,
    },
    confirmButtonDisabled: { opacity: 0.5 },
    confirmButtonText: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: '#FFFFFF' },
  });
}
