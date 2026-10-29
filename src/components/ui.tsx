import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { maxContentWidth, radius, space, useTheme } from '@/lib/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type TxtProps = TextProps & {
  variant?: 'title' | 'heading' | 'body' | 'label' | 'small' | 'caption';
  muted?: boolean;
  color?: string;
};

const sizes = {
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.3 },
};

export function Txt({ variant = 'body', muted, color, style, ...rest }: TxtProps) {
  const { c } = useTheme();
  return <Text style={[sizes[variant], { color: color ?? (muted ? c.textMuted : c.text) }, style]} {...rest} />;
}

/** Scrollable page with a calm background, safe-area padding and a centered max width. */
export function Screen({
  children,
  scroll = true,
  header,
  footer,
}: {
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const inner = <View style={styles.content}>{children}</View>;
  return (
    <View style={[styles.flex, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingBottom: footer ? 0 : insets.bottom }]}>{inner}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md, borderTopColor: c.border, backgroundColor: c.bg }]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function Header({ title, right, onBack }: { title?: string; right?: ReactNode; onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerInner}>
        <IconButton
          icon="chevron-back"
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
          accessibilityLabel="Back"
        />
        <Txt variant="label" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Txt>
        <View style={styles.headerRight}>{right}</View>
      </View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'surface' | 'alt' | 'primary';
}) {
  const { c } = useTheme();
  const bg = tone === 'alt' ? c.surfaceAlt : tone === 'primary' ? c.primarySoft : c.surface;
  const base = [styles.card, { backgroundColor: bg, borderColor: c.border, shadowColor: c.shadow }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [base, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  icon,
  kind = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const bg = { primary: c.primary, secondary: c.primarySoft, ghost: 'transparent', danger: c.dangerSoft }[kind];
  const fg = { primary: c.onPrimary, secondary: c.primary, ghost: c.primary, danger: c.danger }[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Txt variant="label" color={fg}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  active,
  size = 22,
  ...rest
}: { icon: IconName; onPress?: () => void; active?: boolean; size?: number } & Omit<PressableProps, 'children'>) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: active ? c.primarySoft : 'transparent' },
        pressed && styles.pressed,
      ]}
      {...rest}>
      <Ionicons name={icon} size={size} color={active ? c.primary : c.text} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? c.primary : c.surface, borderColor: active ? c.primary : c.border },
        pressed && styles.pressed,
      ]}>
      <Txt variant="small" color={active ? c.onPrimary : c.text} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginVertical: space.md }} />;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.lg },
  header: { paddingHorizontal: space.sm, paddingVertical: space.xs },
  headerInner: {
    width: '100%',
    maxWidth: maxContentWidth + space.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerRight: { minWidth: 40, flexDirection: 'row', justifyContent: 'flex-end' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, paddingHorizontal: space.lg },
  footerInner: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' },
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { boxShadow: '0 6px 24px rgba(31,42,46,0.06)' },
      default: { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 1 },
    }),
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconButton: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
});
