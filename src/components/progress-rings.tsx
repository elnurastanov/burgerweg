import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Drawn in a 120×120 box and scaled to `size`. The rings touch: outer 52±5, inner 43±4. */
const BOX = 120;
const OUTER = { r: 52, stroke: 10 };
const INNER = { r: 43, stroke: 8 };

export type RingSegment = { value: number; color: string };

/**
 * Two concentric progress rings. The outer ring shows consecutive segments (e.g. correct, then to review),
 * the inner ring a single value (e.g. today's answers against the daily goal). Values are fractions 0–1.
 */
export function ProgressRings({
  outer,
  inner,
  size = 112,
  children,
}: {
  outer: RingSegment[];
  inner: RingSegment;
  size?: number;
  children?: React.ReactNode;
}) {
  const { c } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  let start = 0;
  const segments = outer.map((s) => {
    const value = clamp(s.value, 1 - start);
    const seg = { ...s, value, start };
    start += value;
    return seg;
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} style={{ position: 'absolute' }}>
        <Circle cx={BOX / 2} cy={BOX / 2} r={OUTER.r} stroke={c.surfaceAlt} strokeWidth={OUTER.stroke} fill="none" />
        <Circle cx={BOX / 2} cy={BOX / 2} r={INNER.r} stroke={c.surfaceAlt} strokeWidth={INNER.stroke} fill="none" />
        {/* Later segments first, so each earlier segment's round cap sits on top of the next one. */}
        {[...segments].reverse().map((s, i) =>
          s.value > 0 ? <Arc key={i} {...OUTER} start={s.start} value={s.value} color={s.color} progress={progress} /> : null,
        )}
        {inner.value > 0 ? (
          <Arc {...INNER} start={0} value={clamp(inner.value, 1)} color={inner.color} progress={progress} />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, value || 0));
}

/** One arc from `start` to `start + value` (fractions of the circle, clockwise from 12 o'clock). */
function Arc({
  r,
  stroke,
  start,
  value,
  color,
  progress,
}: {
  r: number;
  stroke: number;
  start: number;
  value: number;
  color: string;
  progress: SharedValue<number>;
}) {
  const circumference = 2 * Math.PI * r;
  const length = circumference * value;
  // With a dash of `length`, an offset of length·(1−p) shows the first p of the arc: it grows from its start.
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));
  return (
    <AnimatedCircle
      cx={BOX / 2}
      cy={BOX / 2}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={`${length} ${circumference}`}
      transform={`rotate(${-90 + start * 360} ${BOX / 2} ${BOX / 2})`}
      animatedProps={animatedProps}
    />
  );
}
