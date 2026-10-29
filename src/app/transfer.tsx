import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useDialog } from '@/components/dialog';
import { Button, Card, Header, Row, Screen, Txt } from '@/components/ui';
import { transferLink } from '@/lib/config';
import { useT } from '@/lib/i18n';
import { stateName } from '@/lib/questions';
import { useApp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';
import {
  clearTransferFromUrl,
  decodeTransfer,
  encodeTransfer,
  mergeProgress,
  peekTransferFromUrl,
  type Decoded,
} from '@/lib/transfer';

const FILE_NAME = 'buergerweg-progress.txt';

export default function Transfer() {
  const { settings, progress, replaceProgress } = useApp();
  const { notify } = useDialog();
  const t = useT();
  const { c } = useTheme();
  const [pasted, setPasted] = useState('');
  const [copied, setCopied] = useState(false);
  // A link opened in the browser (captured at startup in _layout) shows the import card right away.
  const [incoming, setIncoming] = useState<Decoded | null>(() => {
    const fromUrl = peekTransferFromUrl();
    return fromUrl && fromUrl !== 'invalid' ? fromUrl : null;
  });

  const code = useMemo(() => encodeTransfer(progress, settings.state), [progress, settings.state]);
  // The QR code and the copied text are a link (web app + code in the #fragment), so a phone camera can open it.
  const link = useMemo(() => transferLink(code), [code]);

  const receive = useCallback(
    (text: string) => {
      const decoded = decodeTransfer(text);
      if (decoded) setIncoming(decoded);
      else notify(t('importInvalid'));
    },
    [t, notify],
  );

  // A broken link (e.g. cut off while copying) gets the same message as a broken pasted code.
  useEffect(() => {
    if (peekTransferFromUrl() !== 'invalid') return;
    clearTransferFromUrl();
    notify(t('importInvalid'));
  }, [notify, t]);

  const dismiss = () => {
    clearTransferFromUrl();
    setIncoming(null);
  };

  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const exportFile = async () => {
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([link], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = FILE_NAME;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const file = new File(Paths.cache, FILE_NAME);
    file.create({ overwrite: true });
    await file.write(link);
    await Sharing.shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: t('transferTitle') });
  };

  const importFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (res.canceled || !res.assets[0]) return;
    const asset = res.assets[0];
    const text = asset.file ? await asset.file.text() : await new File(asset.uri).text();
    receive(text);
  };

  const apply = (mode: 'merge' | 'replace') => {
    if (!incoming) return;
    if (mode === 'replace') replaceProgress(incoming.progress, incoming.state);
    else replaceProgress(mergeProgress(progress, incoming.progress));
    dismiss();
    setPasted('');
    notify(t('importDone'));
  };

  const incomingAnswered = incoming ? Object.values(incoming.progress.stats).filter((s) => s.r).length : 0;

  return (
    <Screen header={<Header title={t('transferTitle')} />}>
      <Txt muted>{t('transferIntro')}</Txt>

      <Card style={{ gap: space.lg, alignItems: 'center' }}>
        <Row style={{ alignSelf: 'stretch' }}>
          <Ionicons name="arrow-up-circle-outline" size={20} color={c.primary} />
          <Txt variant="heading">{t('sendTitle')}</Txt>
        </Row>
        <View style={[styles.qr, { borderColor: c.border }]}>
          <QRCode value={link} size={232} ecl="L" backgroundColor="#FFFFFF" color="#1F2A2E" />
        </View>
        <Txt variant="small" muted style={{ textAlign: 'center' }}>
          {t('sendHint')}
        </Txt>
        <View style={{ gap: space.sm, alignSelf: 'stretch' }}>
          <Button label={copied ? t('copied') : t('copyCode')} kind="secondary" icon={copied ? 'checkmark' : 'copy-outline'} onPress={copy} />
          <Button label={t('exportFile')} kind="secondary" icon="document-outline" onPress={exportFile} />
        </View>
      </Card>

      {incoming ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={{ gap: space.md, borderColor: c.primary, borderWidth: 1.5 }}>
            <Row>
              <Ionicons name="download-outline" size={20} color={c.primary} />
              <Txt variant="heading">{t('importFound')}</Txt>
            </Row>
            <Txt variant="small">
              {t('importSummary', {
                answered: incomingAnswered,
                exams: incoming.progress.exams.length,
                state: stateName(incoming.state, settings.lang) || '–',
              })}
            </Txt>
            <View style={{ gap: 4 }}>
              <Button label={t('importMerge')} icon="git-merge-outline" onPress={() => apply('merge')} />
              <Txt variant="caption" muted style={{ textAlign: 'center' }}>
                {t('importMergeHint')}
              </Txt>
            </View>
            <View style={{ gap: 4 }}>
              <Button label={t('importReplace')} kind="secondary" icon="swap-horizontal" onPress={() => apply('replace')} />
              <Txt variant="caption" muted style={{ textAlign: 'center' }}>
                {t('importReplaceHint')}
              </Txt>
            </View>
            <Button label={t('cancel')} kind="ghost" onPress={dismiss} />
          </Card>
        </Animated.View>
      ) : (
        <Card style={{ gap: space.md }}>
          <Row>
            <Ionicons name="arrow-down-circle-outline" size={20} color={c.primary} />
            <Txt variant="heading">{t('receiveTitle')}</Txt>
          </Row>
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            placeholder={t('pasteCode')}
            placeholderTextColor={c.textMuted}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: c.text, backgroundColor: c.surfaceAlt, borderColor: c.border }]}
          />
          <Button label={t('importCode')} kind="secondary" icon="checkmark" disabled={!pasted.trim()} onPress={() => receive(pasted)} />
          <Button label={t('importFile')} kind="secondary" icon="folder-open-outline" onPress={importFile} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qr: { padding: space.md, backgroundColor: '#FFFFFF', borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  input: {
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
