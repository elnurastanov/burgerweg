import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Bilingual } from '@/components/question-view';
import { Button, Card, Header, Row, Screen, Txt, type IconName } from '@/components/ui';
import { startExam } from '@/lib/exam-session';
import { translate, useT } from '@/lib/i18n';
import { EXAM } from '@/lib/questions';
import { useApp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

export default function ExamIntro() {
  const { settings } = useApp();
  const t = useT();
  const { c } = useTheme();
  const showTr = settings.lang !== 'de';

  const start = () => {
    if (!settings.state) return;
    startExam(settings.state);
    router.push('/exam/run');
  };

  return (
    <Screen header={<Header title={t('examSimulator')} />} footer={<Button label={translate('de', 'examStart')} icon="play" onPress={start} />}>
      <Animated.View entering={FadeInDown.duration(400)} style={{ gap: space.lg, paddingTop: space.lg }}>
        <View style={[styles.hero, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="timer-outline" size={34} color={c.accent} />
        </View>
        <View style={{ gap: 2 }}>
          <Txt variant="title">Testsimulation</Txt>
          {showTr ? (
            <Txt variant="small" muted style={styles.tr}>
              {t('examSimulator')}
            </Txt>
          ) : null}
        </View>
        <Bilingual de={translate('de', 'examIntro')} tr={translate(settings.lang, 'examIntro')} show={showTr} />
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          {(
            [
              ['help-circle-outline', EXAM.general + EXAM.state, 'examFactQuestions'],
              ['time-outline', EXAM.minutes, 'examFactMinutes'],
              ['ribbon-outline', EXAM.passMark, 'examFactPass'],
            ] as const
          ).map(([icon, value, key]) => (
            <Fact key={key} icon={icon} value={String(value)} label={translate('de', key)} tr={showTr ? t(key) : undefined} />
          ))}
        </Row>
        <Card tone="alt">
          <Row style={{ alignItems: 'flex-start' }}>
            <Ionicons name="language-outline" size={20} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Bilingual de={translate('de', 'examIntroHint')} tr={translate(settings.lang, 'examIntroHint')} show={showTr} />
            </View>
          </Row>
        </Card>
      </Animated.View>
    </Screen>
  );
}

/** One number of the exam format. The label is German like the exam; `tr` is the UI-language line under it. */
function Fact({ icon, value, label, tr }: { icon: IconName; value: string; label: string; tr?: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name={icon} size={18} color={c.textMuted} />
      <Txt variant="heading">{value}</Txt>
      <Txt variant="caption" muted>
        {label}
      </Txt>
      {tr ? (
        <Txt variant="caption" muted style={styles.tr}>
          {tr}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tr: { fontStyle: 'italic', opacity: 0.8 },
  hero: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  fact: {
    flex: 1,
    minWidth: 96,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
