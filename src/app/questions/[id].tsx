import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { QuestionView } from '@/components/question-view';
import { Button, Header, IconButton, Row, Screen, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { getPracticeQueue } from '@/lib/practice';
import { getQuestion, getTranslation, translationLang, questionLabel, questionsFor } from '@/lib/questions';
import { useApp } from '@/lib/store';
import { space, useTheme } from '@/lib/theme';

export default function PracticeQuestion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { settings, progress, recordAnswer, toggleStar } = useApp();
  const t = useT();
  const { c } = useTheme();
  const trLang = translationLang(settings.lang);
  const [showTr, setShowTr] = useState(settings.practiceTranslations && settings.lang !== 'de');
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => setSelected(null), [id]);

  const question = getQuestion(id);
  if (!question) return null;

  const queue = getPracticeQueue().length ? getPracticeQueue() : questionsFor(settings.state).map((q) => q.id);
  const pos = queue.indexOf(question.id);
  const prevId = pos > 0 ? queue[pos - 1] : undefined;
  const nextId = pos >= 0 && pos < queue.length - 1 ? queue[pos + 1] : undefined;
  const starred = !!progress.stats[question.id]?.star;
  const answered = selected !== null;
  const correct = selected === question.a;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    recordAnswer(question.id, i === question.a);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(i === question.a ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
    }
  };

  const go = (target?: string) => (target ? router.setParams({ id: target }) : router.back());

  return (
    <Screen
      header={
        <Header
          title={`${t('question')} ${questionLabel(question)}${pos >= 0 ? `  ·  ${pos + 1}/${queue.length}` : ''}`}
          right={
            <Row gap={2}>
              <IconButton icon="language-outline" active={showTr} onPress={() => setShowTr((v) => !v)} accessibilityLabel={t('showTranslation')} />
              <IconButton
                icon={starred ? 'star' : 'star-outline'}
                active={starred}
                onPress={() => toggleStar(question.id)}
                accessibilityLabel={t('star')}
              />
            </Row>
          }
        />
      }
      footer={
        <Row gap={space.md}>
          <Button label={t('previous')} kind="secondary" icon="arrow-back" disabled={!prevId} onPress={() => go(prevId)} style={{ flex: 1 }} />
          <Button
            label={nextId ? t('next') : t('done')}
            icon={nextId ? 'arrow-forward' : 'checkmark'}
            kind={answered ? 'primary' : 'secondary'}
            onPress={() => go(nextId)}
            style={{ flex: 1 }}
          />
        </Row>
      }>
      <Animated.View key={question.id} entering={FadeInDown.duration(300)} style={{ paddingTop: space.sm }}>
        <QuestionView
          question={question}
          translation={getTranslation(trLang, question.id)}
          showTranslation={showTr}
          selected={selected}
          reveal={answered}
          onSelect={choose}
        />
      </Animated.View>
      {answered ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <View style={{ padding: space.md, borderRadius: 14, backgroundColor: correct ? c.successSoft : c.dangerSoft }}>
            <Txt variant="label" color={correct ? c.success : c.danger}>
              {correct ? t('correctAnswer') : t('wrongAnswer')}
            </Txt>
          </View>
        </Animated.View>
      ) : null}
    </Screen>
  );
}
