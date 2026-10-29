import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { SelectOption as Option } from '@/components/select-option';
import { Button, Screen, Txt } from '@/components/ui';
import { LANGUAGES, useT } from '@/lib/i18n';
import { STATES, stateName } from '@/lib/questions';
import { useApp } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

export default function Onboarding() {
  const { settings, updateSettings } = useApp();
  const t = useT();
  const { c } = useTheme();
  const [step, setStep] = useState<'lang' | 'state'>('lang');

  const finish = () => {
    updateSettings({ onboarded: true });
    router.replace('/');
  };

  return (
    <Screen
      footer={
        step === 'lang' ? (
          <Button label={t('continue')} icon="arrow-forward" onPress={() => setStep('state')} />
        ) : (
          <Button label={t('getStarted')} icon="checkmark" disabled={!settings.state} onPress={finish} />
        )
      }>
      <Animated.View entering={FadeInDown.duration(500)} style={{ gap: space.sm, marginTop: space.xxl }}>
        <View style={[styles.badge, { backgroundColor: c.primarySoft }]}>
          <Ionicons name="leaf-outline" size={26} color={c.primary} />
        </View>
        <Txt variant="title">{t('appName')}</Txt>
        <Txt muted>{t('subtitle')}</Txt>
      </Animated.View>

      {step === 'lang' ? (
        <Animated.View key="lang" entering={FadeInRight.duration(350)} style={{ gap: space.md }}>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">{t('chooseLanguage')}</Txt>
            <Txt variant="small" muted>
              {t('chooseLanguageHint')}
            </Txt>
          </View>
          {LANGUAGES.map((l) => (
            <Option key={l.code} label={l.name} active={settings.lang === l.code} onPress={() => updateSettings({ lang: l.code })} />
          ))}
        </Animated.View>
      ) : (
        <Animated.View key="state" entering={FadeInRight.duration(350)} style={{ gap: space.md }}>
          <View style={{ gap: 2 }}>
            <Txt variant="heading">{t('chooseState')}</Txt>
            <Txt variant="small" muted>
              {t('chooseStateHint')}
            </Txt>
          </View>
          <View style={styles.grid}>
            {STATES.map((s) => (
              <View key={s.code} style={styles.gridItem}>
                <Option
                  label={stateName(s.code, settings.lang)}
                  active={settings.state === s.code}
                  onPress={() => updateSettings({ state: s.code })}
                />
              </View>
            ))}
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
  // One column on phones, two on wider screens.
  gridItem: { flexBasis: 260, flexGrow: 1, padding: space.xs },
});
