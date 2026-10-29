import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Txt } from '@/components/ui';
import { questionImages } from '@/data/images';
import type { Question, Translation } from '@/lib/questions';
import { radius, space, useTheme } from '@/lib/theme';

const LETTERS = ['A', 'B', 'C', 'D'];

/** German text with an optional, quieter translation underneath. */
export function Bilingual({
  de,
  tr,
  show,
  variant = 'body',
  color,
}: {
  de: string;
  tr?: string;
  show: boolean;
  variant?: 'heading' | 'body';
  color?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 3 }}>
      <Txt variant={variant} color={color}>
        {de}
      </Txt>
      {show && tr && tr !== de ? (
        <Animated.View entering={FadeIn.duration(220)}>
          <Txt variant="small" color={color ?? c.text} style={styles.translation}>
            {tr}
          </Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

export function QuestionImage({ id }: { id?: string }) {
  const { c } = useTheme();
  const img = id ? questionImages[id] : undefined;
  if (!img) return null;
  return (
    <View style={[styles.imageWrap, { borderColor: c.border }]}>
      <Image source={img.src} style={{ width: '100%', aspectRatio: img.ratio }} contentFit="contain" />
    </View>
  );
}

export function QuestionView({
  question,
  translation,
  showTranslation,
  selected,
  reveal,
  onSelect,
}: {
  question: Question;
  translation?: Translation;
  showTranslation: boolean;
  selected: number | null;
  /** Practice mode: color the correct and the wrong choice. */
  reveal: boolean;
  onSelect: (index: number) => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: space.lg }}>
      <Bilingual de={question.q} tr={translation?.q} show={showTranslation} variant="heading" />
      <QuestionImage id={question.img} />
      <View style={{ gap: space.sm }}>
        {question.o.map((opt, i) => {
          const isCorrect = i === question.a;
          const isSelected = selected === i;
          let bg = c.surface;
          let border = c.border;
          let icon: 'checkmark-circle' | 'close-circle' | null = null;
          let tint = c.text;
          if (reveal && isCorrect) {
            bg = c.successSoft;
            border = c.success;
            icon = 'checkmark-circle';
            tint = c.success;
          } else if (reveal && isSelected) {
            bg = c.dangerSoft;
            border = c.danger;
            icon = 'close-circle';
            tint = c.danger;
          } else if (isSelected) {
            bg = c.primarySoft;
            border = c.primary;
            tint = c.primary;
          }
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(i)}
              disabled={reveal}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.option,
                { backgroundColor: bg, borderColor: border },
                pressed && !reveal && { opacity: 0.8 },
              ]}>
              <View style={[styles.letter, { borderColor: tint, backgroundColor: isSelected && !reveal ? c.primary : 'transparent' }]}>
                <Txt variant="caption" color={isSelected && !reveal ? c.onPrimary : tint}>
                  {LETTERS[i]}
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Bilingual de={opt} tr={translation?.o[i]} show={showTranslation} />
              </View>
              {icon ? <Ionicons name={icon} size={22} color={tint} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  translation: { opacity: 0.55, fontStyle: 'italic' },
  imageWrap: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', backgroundColor: '#fff' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  letter: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
