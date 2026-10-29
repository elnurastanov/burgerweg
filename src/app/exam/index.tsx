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
        <Txt variant="title">Testsimulation</Txt>
        <Bilingual de={translate('de', 'examIntro')} tr={translate(settings.lang, 'examIntro')} show={showTr} />
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          <Fact icon="help-circle-outline" value={String(EXAM.general + EXAM.state)} label="Fragen" />
          <Fact icon="time-outline" value={`${EXAM.minutes}`} label="Minuten" />
          <Fact icon="ribbon-outline" value={`${EXAM.passMark}`} label="zum Bestehen" />
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

function Fact({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Ionicons name={icon} size={18} color={c.textMuted} />
      <Txt variant="heading">{value}</Txt>
      <Txt variant="caption" muted>
        {label}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
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
