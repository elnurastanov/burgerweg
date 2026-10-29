import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useDialog } from '@/components/dialog';
import { QuestionView } from '@/components/question-view';
import { Button, IconButton, Row, Screen, Txt } from '@/components/ui';
import { getExam } from '@/lib/exam-session';
import { translate } from '@/lib/i18n';
import { EXAM, getQuestion, getTranslation, translationLang } from '@/lib/questions';
import { formatDuration } from '@/lib/stats';
import { useApp } from '@/lib/store';
import { maxContentWidth, radius, space, useTheme } from '@/lib/theme';

// The simulator chrome is always German, like the real test.
const de = (key: Parameters<typeof translate>[1], params?: Record<string, string | number>) => translate('de', key, params);

export default function ExamRun() {
  const session = getExam();
  const { settings, addExam } = useApp();
  const { confirm } = useDialog();
  const { c } = useTheme();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => session?.answers ?? []);
  const [showTr, setShowTr] = useState(false);
  const [overview, setOverview] = useState(false);
  const [remaining, setRemaining] = useState(EXAM.minutes * 60);
  const submitted = useRef(false);
  const trLang = translationLang(settings.lang);

  const submit = useCallback(() => {
    if (!session || submitted.current) return;
    submitted.current = true;
    session.answers = answers;
    session.finishedAt = Date.now();
    const results = session.ids.map((id, i) => ({ id, correct: answers[i] === getQuestion(id)?.a }));
    addExam(
      {
        t: session.startedAt,
        score: results.filter((r) => r.correct).length,
        total: session.ids.length,
        seconds: Math.min(EXAM.minutes * 60, Math.round((session.finishedAt - session.startedAt) / 1000)),
      },
      results,
    );
    router.replace('/exam/result');
  }, [session, answers, addExam]);

  useEffect(() => {
    if (!session) return;
    const deadline = session.startedAt + EXAM.minutes * 60 * 1000;
    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) submit();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [session, submit]);

  if (!session) return <Redirect href="/exam" />;

  const total = session.ids.length;
  const question = getQuestion(session.ids[index])!;
  const open = answers.filter((a) => a === null).length;
  const lowTime = remaining < 5 * 60;

  const select = (i: number) => setAnswers((prev) => prev.map((a, k) => (k === index ? i : a)));

  const askSubmit = async () => {
    const msg = open ? de('examSubmitConfirm', { open }) : de('examSubmitConfirmAll');
    if (await confirm({ message: msg, okLabel: de('examSubmit'), cancelLabel: de('cancel') })) submit();
  };

  const leave = async () => {
    const ok = await confirm({ message: de('examLeave'), okLabel: de('examLeaveYes'), cancelLabel: de('cancel'), destructive: true });
    if (!ok) return;
    submitted.current = true;
    if (router.canGoBack()) router.back();
    else router.replace('/exam');
  };

  return (
    <Screen
      header={
        <View style={styles.header}>
          <Row style={styles.headerInner}>
            <IconButton icon="close" onPress={leave} accessibilityLabel={de('examLeaveYes')} />
            <View style={[styles.timer, { backgroundColor: lowTime ? c.dangerSoft : c.surfaceAlt }]}>
              <Ionicons name="time-outline" size={16} color={lowTime ? c.danger : c.textMuted} />
              <Txt variant="label" color={lowTime ? c.danger : c.text} style={{ fontVariant: ['tabular-nums'] }}>
                {formatDuration(remaining)}
              </Txt>
            </View>
            <Row gap={2}>
              <IconButton icon="language-outline" active={showTr} onPress={() => setShowTr((v) => !v)} accessibilityLabel="Übersetzung" />
              <IconButton icon="grid-outline" active={overview} onPress={() => setOverview((v) => !v)} accessibilityLabel={de('examOverview')} />
            </Row>
          </Row>
          <View style={[styles.track, { backgroundColor: c.surfaceAlt }]}>
            <View style={[styles.bar, { backgroundColor: c.primary, width: `${((total - open) / total) * 100}%` }]} />
          </View>
        </View>
      }
      footer={
        <Row gap={space.md}>
          <Button label={de('previous')} kind="secondary" icon="arrow-back" disabled={index === 0} onPress={() => setIndex(index - 1)} style={{ flex: 1 }} />
          {index < total - 1 ? (
            <Button label={de('next')} icon="arrow-forward" onPress={() => setIndex(index + 1)} style={{ flex: 1 }} />
          ) : (
            <Button label={de('examSubmit')} icon="checkmark-done" onPress={askSubmit} style={{ flex: 1 }} />
          )}
        </Row>
      }>
      {overview ? (
        <Animated.View entering={FadeIn.duration(200)} style={{ gap: space.md, paddingTop: space.sm }}>
          <Txt variant="label">{de('examOverview')}</Txt>
          <View style={styles.grid}>
            {session.ids.map((id, i) => {
              const done = answers[i] !== null;
              const here = i === index;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    setIndex(i);
                    setOverview(false);
                  }}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: done ? c.primarySoft : c.surface,
                      borderColor: here ? c.primary : c.border,
                    },
                  ]}>
                  <Txt variant="label" color={done ? c.primary : c.textMuted}>
                    {i + 1}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          <Button label={de('examSubmit')} kind="secondary" icon="checkmark-done" onPress={askSubmit} />
        </Animated.View>
      ) : (
        <Animated.View key={index} entering={FadeInDown.duration(260)} style={{ gap: space.md, paddingTop: space.sm }}>
          <Txt variant="caption" muted style={{ letterSpacing: 1 }}>
            {de('examQuestionOf', { n: index + 1, total }).toUpperCase()}
          </Txt>
          <QuestionView
            question={question}
            translation={getTranslation(trLang, question.id)}
            showTranslation={showTr}
            selected={answers[index]}
            reveal={false}
            onSelect={select}
          />
        </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.sm, paddingBottom: space.sm, gap: space.sm },
  headerInner: { width: '100%', maxWidth: maxContentWidth + space.lg, alignSelf: 'center', justifyContent: 'space-between', minHeight: 48 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill },
  track: { height: 4, borderRadius: 2, overflow: 'hidden', width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  bar: { height: '100%', borderRadius: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cell: { width: 48, height: 48, borderRadius: radius.sm, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
