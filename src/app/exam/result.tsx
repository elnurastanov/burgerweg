import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { ProgressRing } from '@/components/progress-ring';
import { Bilingual, QuestionImage } from '@/components/question-view';
import { Button, Card, Header, IconButton, Row, Screen, Txt } from '@/components/ui';
import { getExam, startExam } from '@/lib/exam-session';
import { useT } from '@/lib/i18n';
import { EXAM, getQuestion, getTranslation, translationLang, questionLabel } from '@/lib/questions';
import { formatDuration } from '@/lib/stats';
import { useApp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

export default function ExamResult() {
  const session = getExam();
  const { settings } = useApp();
  const t = useT();
  const { c } = useTheme();
  const trLang = translationLang(settings.lang);
  const [showTr, setShowTr] = useState(settings.lang !== 'de' && settings.practiceTranslations);

  if (!session?.finishedAt) return <Redirect href="/exam" />;

  const items = session.ids.map((id, i) => ({ q: getQuestion(id)!, answer: session.answers[i] }));
  const score = items.filter((x) => x.answer === x.q.a).length;
  const passed = score >= EXAM.passMark;
  const seconds = Math.min(EXAM.minutes * 60, Math.round((session.finishedAt - session.startedAt) / 1000));
  const tint = passed ? c.success : c.danger;

  const again = () => {
    if (!settings.state) return;
    startExam(settings.state);
    router.replace('/exam/run');
  };

  return (
    <Screen
      header={
        <Header
          title={t('result')}
          onBack={() => router.dismissTo('/')}
          right={
            <IconButton icon="language-outline" active={showTr} onPress={() => setShowTr((v) => !v)} accessibilityLabel={t('showTranslation')} />
          }
        />
      }>
      <Animated.View entering={ZoomIn.duration(500)} style={{ alignItems: 'center', gap: space.md, paddingTop: space.lg }}>
        <ProgressRing value={score / items.length} size={150} stroke={12} color={tint}>
          <Txt variant="title">
            {score}/{items.length}
          </Txt>
        </ProgressRing>
        <View style={[styles.badge, { backgroundColor: passed ? c.successSoft : c.dangerSoft }]}>
          <Ionicons name={passed ? 'checkmark-circle' : 'refresh-circle'} size={18} color={tint} />
          <Txt variant="label" color={tint}>
            {passed ? t('passed') : t('failed')}
          </Txt>
        </View>
        <Txt variant="small" muted style={{ textAlign: 'center' }}>
          {t('passMark', { mark: EXAM.passMark })}
          {'\n'}
          {t('timeUsed', { time: formatDuration(seconds) })}
        </Txt>
      </Animated.View>

      <View style={{ gap: space.sm }}>
        <Button label={t('tryAgain')} icon="refresh" onPress={again} />
        <Button label={t('backHome')} kind="secondary" onPress={() => router.dismissTo('/')} />
      </View>

      <Txt variant="heading" style={{ marginTop: space.sm }}>
        {t('reviewAnswers')}
      </Txt>
      {items.map(({ q, answer }, i) => {
        const ok = answer === q.a;
        const tr = getTranslation(trLang, q.id);
        return (
          <Animated.View key={q.id} entering={FadeInDown.duration(300).delay(Math.min(i, 8) * 40)}>
            <Card style={{ gap: space.md }}>
              <Row>
                <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={20} color={ok ? c.success : c.danger} />
                <Txt variant="caption" muted>
                  {i + 1}. · {questionLabel(q)}
                </Txt>
              </Row>
              <Bilingual de={q.q} tr={tr?.q} show={showTr} />
              <QuestionImage id={q.img} />
              {!ok ? (
                <View style={[styles.answer, { backgroundColor: c.dangerSoft }]}>
                  <Txt variant="caption" color={c.danger}>
                    {t('yourAnswer').toUpperCase()}
                  </Txt>
                  {answer === null ? (
                    <Txt variant="small" color={c.danger}>
                      {t('notAnswered')}
                    </Txt>
                  ) : (
                    <Bilingual de={q.o[answer]} tr={tr?.o[answer]} show={showTr} color={c.danger} />
                  )}
                </View>
              ) : null}
              <View style={[styles.answer, { backgroundColor: c.successSoft }]}>
                <Txt variant="caption" color={c.success}>
                  {t('answer').toUpperCase()}
                </Txt>
                <Bilingual de={q.o[q.a]} tr={tr?.o[q.a]} show={showTr} color={c.success} />
              </View>
            </Card>
          </Animated.View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  answer: { padding: space.md, borderRadius: radius.sm, gap: 4 },
});
