import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { authColors, fontFamilies } from './authStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'PrivacyPolicy'>;

/**
 * Written from what Moien actually does today (single source of truth: the
 * security/privacy audit run earlier on this codebase), not a generic
 * template — sections marked "REVISÃO JURÍDICA NECESSÁRIA" are exactly the
 * ones that audit flagged as needing real legal review before this can be
 * published as the project's binding policy.
 */
function Section({ title, legalFlag, children }: { title: string; legalFlag?: boolean; children: React.ReactNode }) {
  const styles = sectionStyles;
  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {legalFlag && (
          <View style={styles.flag}>
            <Text style={styles.flagText}>REVISÃO JURÍDICA NECESSÁRIA</Text>
          </View>
        )}
      </View>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  section: { marginBottom: 26 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  title: { fontFamily: fontFamilies.displayBold, fontSize: 16, color: authColors.textPrimary },
  flag: {
    backgroundColor: 'rgba(240, 201, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(240, 201, 74, 0.4)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  flagText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 10, letterSpacing: 0.4, color: '#F0C94A' },
  body: { fontFamily: fontFamilies.displayRegular, fontSize: 14, lineHeight: 22, color: authColors.textSecondary },
});

export function PrivacyPolicyScreen({ navigation }: Props) {
  const styles = useMemo(() => makeStyles(), []);

  return (
    <View style={styles.page}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink} hitSlop={8}>
          <Ionicons name="arrow-back" size={16} color={authColors.textPrimary} />
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>

        <Text style={styles.pageTitle}>Política de Privacidade do Moien</Text>
        <Text style={styles.pageSubtitle}>
          Última atualização: 20 de setembro de 2026. Este documento descreve exatamente o que o Moien coleta e faz
          hoje — nada aqui é aspiracional ou baseado em funcionalidades que ainda não existem.
        </Text>

        <Section title="Quais dados coletamos">
          No cadastro: seu nome, e-mail e senha (a senha é gerenciada inteiramente pelo Firebase Authentication —
          nunca fica em texto puro em nenhum banco de dados do Moien). Se você entra com o Google, seu nome e e-mail
          vêm diretamente do Google como provedor de login. Durante o uso do app, guardamos seu progresso: XP,
          sequência de dias (ofensiva), lições concluídas, o histórico recente de respostas (para saber o que
          revisar com você) e, se você escolher enviar uma, sua foto de perfil.
        </Section>

        <Section title="Foto de perfil">
          A foto de perfil é totalmente opcional e só é enviada depois que você lê e confirma o aviso de
          consentimento mostrado antes do envio. A imagem escolhida é redimensionada no seu próprio navegador antes
          de ser salva. Você pode trocar ou remover sua foto a qualquer momento na aba Perfil; removê-la não afeta
          nenhum outro dado da sua conta.
        </Section>

        <Section title="Por que coletamos" legalFlag>
          Para autenticar sua conta, salvar seu progresso entre sessões e dispositivos, e adaptar as revisões ao que
          você já domina. A base legal exata (consentimento, execução de contrato etc., conforme a LGPD) precisa de
          revisão jurídica antes deste documento valer como política oficial.
        </Section>

        <Section title="Onde ficam armazenados" legalFlag>
          Nos servidores do Google Firebase (Authentication e Firestore) — o Moien não tem servidor próprio, é um
          site estático que fala diretamente com o Firebase. A localização exata dos servidores e os termos do
          subprocessador (Google) precisam de revisão jurídica.
        </Section>

        <Section title="Por quanto tempo guardamos" legalFlag>
          Hoje o Moien não define um prazo de retenção automático nem exclusão programada — os dados ficam até você
          solicitar a remoção ou até definirmos formalmente uma política de retenção.
        </Section>

        <Section title="Com quem compartilhamos">
          Com ninguém além da própria infraestrutura do Firebase/Google (que hospeda a autenticação e o banco de
          dados) e do Google como provedor de login, caso você use "Entrar com Google". O Moien não vende nem
          compartilha seus dados com terceiros para publicidade — não existe nenhuma integração desse tipo no app
          hoje, nem qualquer SDK de analytics ou rastreamento.
        </Section>

        <Section title="Cookies e armazenamento local">
          O Moien não grava cookies próprios. A permanência do seu login usa o mecanismo interno do Firebase
          Authentication no navegador.
        </Section>

        <Section title="Seus direitos e como pedir alteração ou remoção" legalFlag>
          Você pode trocar sua senha e sua foto de perfil diretamente na aba Perfil. Hoje não existe um botão de
          "excluir minha conta" dentro do app — qualquer pedido de exclusão total de dados precisa ser tratado
          manualmente até essa funcionalidade existir. Os direitos formais do titular dos dados (acesso, correção,
          portabilidade, exclusão, conforme a LGPD) precisam ser redigidos com apoio jurídico antes deste documento
          valer como política oficial.
        </Section>
      </ScrollView>
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg, overflow: 'hidden' },
    blob: { position: 'absolute', borderRadius: 9999, opacity: 0.3 },
    blobTop: { width: 480, height: 480, top: -200, left: -160, backgroundColor: authColors.blobBlue },
    blobBottom: { width: 520, height: 520, bottom: -220, right: -180, backgroundColor: authColors.blobCyan },
    scroll: { flex: 1 },
    content: { maxWidth: 760, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 60 },
    backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24, alignSelf: 'flex-start' },
    backLinkText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 14, color: authColors.textPrimary },
    pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 26, color: authColors.textPrimary, marginBottom: 10 },
    pageSubtitle: {
      fontFamily: fontFamilies.displayRegular,
      fontSize: 13,
      color: authColors.textMuted,
      lineHeight: 19,
      marginBottom: 32,
    },
  });
}
