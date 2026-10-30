import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useDialog } from '@/components/dialog';
import { SelectOption } from '@/components/select-option';
import { Button, Card, Chip, Header, Row, Screen, Txt } from '@/components/ui';
import { LANGUAGES, useT } from '@/lib/i18n';
import { canOpenLinksInApp, openLinkSettings } from '@/lib/link-settings';
import { applyUpdate, fetchLatestVersion, isInstalledPwa, isNewer } from '@/lib/pwa';
import { CATALOG_VERSION, STATES, stateName } from '@/lib/questions';
import { useApp, type ThemeMode } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

// From app.json at build time, e.g. "1.1.0".
const APP_VERSION = Constants.expoConfig?.version ?? '?';

export default function Settings() {
  const { settings, updateSettings, resetProgress } = useApp();
  const { confirm } = useDialog();
  const t = useT();
  const { c } = useTheme();
  const [statesOpen, setStatesOpen] = useState(false);

  const themes: [ThemeMode, string][] = [
    ['system', t('themeSystem')],
    ['light', t('themeLight')],
    ['dark', t('themeDark')],
  ];

  const reset = async () => {
    if (await confirm({ message: t('resetConfirm'), okLabel: t('reset'), cancelLabel: t('cancel'), destructive: true })) resetProgress();
  };

  return (
    <Screen header={<Header title={t('settings')} />}>
      <Section title={t('language')}>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {LANGUAGES.map((l) => (
            <Chip key={l.code} label={l.name} active={settings.lang === l.code} onPress={() => updateSettings({ lang: l.code })} />
          ))}
        </Row>
      </Section>

      <Section title={t('federalState')}>
        <Pressable onPress={() => setStatesOpen((v) => !v)}>
          <Row>
            <Ionicons name="location-outline" size={18} color={c.primary} />
            <Txt variant="label" style={{ flex: 1 }}>
              {stateName(settings.state, settings.lang)}
            </Txt>
            <Ionicons name={statesOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          </Row>
        </Pressable>
        {statesOpen ? (
          <View style={{ gap: space.sm, marginTop: space.md }}>
            {STATES.map((s) => (
              <SelectOption
                key={s.code}
                label={stateName(s.code, settings.lang)}
                active={settings.state === s.code}
                onPress={() => {
                  updateSettings({ state: s.code });
                  setStatesOpen(false);
                }}
              />
            ))}
          </View>
        ) : null}
      </Section>

      <Section title={t('appearance')}>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {themes.map(([mode, label]) => (
            <Chip key={mode} label={label} active={settings.theme === mode} onPress={() => updateSettings({ theme: mode })} />
          ))}
        </Row>
        {settings.lang !== 'de' ? (
          <Row style={{ marginTop: space.lg }}>
            <View style={{ flex: 1 }}>
              <Txt variant="label">{t('practiceTranslations')}</Txt>
              <Txt variant="small" muted>
                {t('practiceTranslationsHint')}
              </Txt>
            </View>
            <Switch
              value={settings.practiceTranslations}
              onValueChange={(v) => updateSettings({ practiceTranslations: v })}
              trackColor={{ true: c.primary, false: c.border }}
              thumbColor="#fff"
            />
          </Row>
        ) : null}
      </Section>

      <Section title={t('data')}>
        <LinkRow icon="swap-horizontal-outline" label={t('transferProgress')} onPress={() => router.push('/transfer')} />
        <View style={[styles.sep, { backgroundColor: c.border }]} />
        {canOpenLinksInApp() && (
          <>
            <LinkRow icon="open-outline" label={t('linksTitle')} onPress={openLinkSettings} />
            <View style={[styles.sep, { backgroundColor: c.border }]} />
          </>
        )}
        <LinkRow icon="trash-outline" label={t('resetProgress')} onPress={reset} color={c.danger} />
      </Section>

      <Section title={t('about')}>
        <Txt variant="small" style={{ marginBottom: space.sm }}>
          {t('appVersion', { version: APP_VERSION })}
        </Txt>
        {isInstalledPwa() && <PwaUpdate />}
        <Txt variant="small" muted>
          {t('aboutText', { version: new Date(CATALOG_VERSION).toLocaleDateString(settings.lang === 'de' ? 'de-DE' : 'en-GB') })}
        </Txt>
      </Section>
    </Screen>
  );
}

/**
 * Installed PWAs have no reload button, so they get an update check here. It runs when Settings opens; browser
 * tabs and the Android app don't show it (a tab reloads, the Android app updates through F-Droid).
 */
function PwaUpdate() {
  const t = useT();
  const [status, setStatus] = useState<{ kind: 'checking' | 'latest' | 'error' } | { kind: 'available'; version: string }>({ kind: 'checking' });

  const check = useCallback(async () => {
    setStatus({ kind: 'checking' });
    const latest = await fetchLatestVersion();
    if (!latest) setStatus({ kind: 'error' });
    else if (isNewer(latest, APP_VERSION)) setStatus({ kind: 'available', version: latest });
    else setStatus({ kind: 'latest' });
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const message = {
    checking: t('updateChecking'),
    latest: t('updateLatest'),
    error: t('updateError'),
    available: status.kind === 'available' ? t('updateAvailable', { version: status.version }) : '',
  }[status.kind];

  return (
    <View style={{ gap: space.sm, marginBottom: space.md }}>
      <Txt variant="small" muted={status.kind !== 'available'}>
        {message}
      </Txt>
      {status.kind === 'available' && <Button label={t('updateNow')} icon="refresh" onPress={applyUpdate} />}
      {(status.kind === 'latest' || status.kind === 'error') && <Button label={t('updateCheckAgain')} icon="refresh" kind="secondary" onPress={check} />}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Txt variant="caption" muted style={{ letterSpacing: 1.2, marginLeft: space.xs }}>
        {title.toUpperCase()}
      </Txt>
      <Card>{children}</Card>
    </View>
  );
}

function LinkRow({ icon, label, onPress, color }: { icon: 'trash-outline' | 'swap-horizontal-outline' | 'open-outline'; label: string; onPress: () => void; color?: string }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Row>
        <Ionicons name={icon} size={20} color={color ?? c.primary} />
        <Txt variant="label" style={{ flex: 1 }} color={color}>
          {label}
        </Txt>
        <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sep: { height: StyleSheet.hairlineWidth, marginVertical: space.md },
});
