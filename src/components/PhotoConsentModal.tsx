import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authColors, fontFamilies } from '../screens/authStyles';

interface Props {
  visible: boolean;
  previewUri: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  onOpenPrivacyPolicy: () => void;
}

export function PhotoConsentModal({ visible, previewUri, onCancel, onConfirm, onOpenPrivacyPolicy }: Props) {
  const styles = useMemo(() => makeStyles(), []);
  const [agreed, setAgreed] = useState(false);

  // Reset the checkbox each time the modal is (re)opened for a new photo —
  // consent for one photo shouldn't silently carry over to the next.
  React.useEffect(() => {
    if (visible) setAgreed(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {previewUri && <Image source={{ uri: previewUri }} style={styles.preview} />}

            <Text style={styles.title}>Usar esta foto como sua imagem de perfil?</Text>
            <Text style={styles.body}>
              Você está escolhendo uma foto para utilizar como sua imagem de perfil no Moien. Antes de continuar,
              veja o que isso significa:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bullet}>• A foto é fornecida voluntariamente por você.</Text>
              <Text style={styles.bullet}>• Ela será usada como sua foto de perfil no Moien.</Text>
              <Text style={styles.bullet}>
                • Ela pode ser exibida para outras pessoas nas áreas do Moien onde o seu perfil for visível.
              </Text>
              <Text style={styles.bullet}>• Você pode trocar ou remover essa foto quando quiser.</Text>
              <Text style={styles.bullet}>
                • O tratamento da imagem segue a Política de Privacidade do Moien.
              </Text>
            </View>

            <Pressable onPress={onOpenPrivacyPolicy} hitSlop={6}>
              <Text style={styles.policyLink}>Ler Política de Privacidade</Text>
            </Pressable>

            <Pressable style={styles.checkboxRow} onPress={() => setAgreed((a) => !a)}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Li e concordo com o uso da minha foto de perfil.</Text>
            </Pressable>

            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, !agreed && styles.confirmButtonDisabled]}
                onPress={onConfirm}
                disabled={!agreed}
              >
                <Text style={styles.confirmButtonText}>Concordar e continuar</Text>
              </Pressable>
            </View>
          </ScrollView>
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
      maxWidth: 420,
      maxHeight: '86%',
      backgroundColor: authColors.pageBgTop,
      borderWidth: 1,
      borderColor: authColors.cardBorder,
      borderRadius: 24,
      shadowColor: authColors.accentBlue,
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.4,
      shadowRadius: 40,
      elevation: 12,
    },
    scrollContent: { padding: 24 },
    preview: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignSelf: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderColor: authColors.accentCyan,
    },
    title: { fontFamily: fontFamilies.displayBold, fontSize: 17, color: authColors.textPrimary, textAlign: 'center', marginBottom: 10 },
    body: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary, lineHeight: 19, marginBottom: 12 },
    bulletList: { gap: 6, marginBottom: 14 },
    bullet: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, lineHeight: 18 },
    policyLink: {
      fontFamily: fontFamilies.displaySemiBold,
      fontSize: 13,
      color: authColors.accentCyan,
      textDecorationLine: 'underline',
      marginBottom: 18,
    },
    checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 22 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: authColors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: { backgroundColor: authColors.accentCyan, borderColor: authColors.accentCyan },
    checkboxLabel: { flex: 1, fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.textPrimary, lineHeight: 18 },
    buttonRow: { flexDirection: 'row', gap: 12 },
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
    confirmButtonDisabled: { opacity: 0.4 },
    confirmButtonText: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: '#FFFFFF' },
  });
}
