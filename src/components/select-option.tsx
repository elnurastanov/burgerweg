import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Txt } from '@/components/ui';
import { radius, space, useTheme } from '@/lib/theme';

export function SelectOption({
  label,
  hint,
  active,
  onPress,
}: {
  label: string;
  /** Optional second line under the label. */
  hint?: string;
  active: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: active ? c.primarySoft : c.surface, borderColor: active ? c.primary : c.border },
        pressed && { opacity: 0.8 },
      ]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="label" color={active ? c.primary : c.text}>
          {label}
        </Txt>
        {hint ? (
          <Txt variant="small" muted>
            {hint}
          </Txt>
        ) : null}
      </View>
      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? c.primary : c.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
});
