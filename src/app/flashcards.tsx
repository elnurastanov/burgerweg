import { useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { QuestionView } from '@/components/question-view';
import { Button, Header, IconButton, Screen, Txt } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { getQuestion, getTranslation, questionLabel, questionsFor, shuffle, translationLang } from '@/lib/questions';
import { useApp } from '@/lib/store';
import { radius, space, useTheme } from '@/lib/theme';

export default function Flashcards() {
  const { settings, recordAnswer } = useApp();
  const t = useT();
  const { c } = useTheme();
  const trLang = translationLang(settings.lang);
  const [showTr, setShowTr] = useState(settings.practiceTranslations && settings.lang !== 'de');
  const [selected, setSelected] = useState<number | null>(null);

  // A shuffled pile of the user's questions; every question comes up once before any repeats.
  const pile = useRef<string[]>([]);
  const draw = (exclude?: string) => {
    if (pile.current.length === 0) {
      pile.current = shuffle(questionsFor(settings.state).map((q) => q.id));
      if (pile.current.length > 1 && pile.current[pile.current.length - 1] === exclude) pile.current.unshift(pile.current.pop()!);
    }
    return pile.current.pop()!;
  };
  const [cardId, setCardId] = useState(() => draw());

  const question = getQuestion(cardId);
  if (!question) return null;

  const answered = selected !== null;
  const correct = selected === question.a;

  const choose = (i: number) => {
    if (answered) return;
    setSelected(i);
    recordAnswer(question.id, i === question.a);
  };

  const next = () => {
    setSelected(null);
    setCardId(draw(cardId));
  };

  return (
    <Screen
      header={
        <Header
          title={t('flashcards')}
          right={
            <IconButton icon="language-outline" active={showTr} onPress={() => setShowTr((v) => !v)} accessibilityLabel={t('showTranslation')} />
          }
        />
      }
      footer={<Button label={t('shuffle')} icon="shuffle" kind={answered ? 'primary' : 'secondary'} onPress={next} />}>
      <Animated.View key={question.id} entering={FadeInDown.duration(300)} style={{ gap: space.md, paddingTop: space.sm }}>
        <Txt variant="caption" muted style={{ letterSpacing: 1 }}>
          {`${t('question')} ${questionLabel(question)}`.toUpperCase()}
        </Txt>
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
          <View style={{ padding: space.md, borderRadius: radius.md, backgroundColor: correct ? c.successSoft : c.dangerSoft }}>
            <Txt variant="label" color={correct ? c.success : c.danger}>
              {correct ? t('correctAnswer') : t('wrongAnswer')}
            </Txt>
          </View>
        </Animated.View>
      ) : null}
    </Screen>
  );
}
