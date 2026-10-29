import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { Txt } from '@/components/ui';
import { radius, space, useTheme } from '@/lib/theme';

export function SelectOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: active ? c.primarySoft : c.surface, borderColor: active ? c.primary : c.border },
        pressed && { opacity: 0.8 },
      ]}>
      <Txt variant="label" style={{ flex: 1 }} color={active ? c.primary : c.text}>
        {label}
      </Txt>
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
