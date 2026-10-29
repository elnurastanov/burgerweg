import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button, Txt } from '@/components/ui';
import { radius, space, useTheme } from '@/lib/theme';

type ConfirmOptions = { message: string; okLabel: string; cancelLabel?: string; destructive?: boolean };
type DialogState = ConfirmOptions & { resolve: (ok: boolean) => void };

type DialogApi = {
  /** In-app yes/no dialog. Browser dialogs can be blocked, so we never rely on them. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Simple message with a single OK button. */
  notify: (message: string, okLabel?: string) => Promise<void>;
};

const Ctx = createContext<DialogApi | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const current = useRef<DialogState | null>(null);

  const close = (ok: boolean) => {
    current.current?.resolve(ok);
    current.current = null;
    setDialog(null);
  };

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        current.current?.resolve(false);
        current.current = { ...options, resolve };
        setDialog(current.current);
      }),
    [],
  );

  const notify = useCallback(
    async (message: string, okLabel = 'OK') => {
      await confirm({ message, okLabel });
    },
    [confirm],
  );

  return (
    <Ctx.Provider value={{ confirm, notify }}>
      {children}
      <Modal visible={!!dialog} transparent animationType="none" onRequestClose={() => close(false)}>
        {dialog ? (
          <Animated.View entering={FadeIn.duration(180)} style={[styles.backdrop, { backgroundColor: 'rgba(10, 16, 14, 0.45)' }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel={dialog.cancelLabel} />
            <Animated.View
              entering={ZoomIn.duration(220)}
              style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
              accessibilityRole="alert">
              <Txt variant="body" style={{ textAlign: 'center' }}>
                {dialog.message}
              </Txt>
              <View style={{ gap: space.sm, alignSelf: 'stretch' }}>
                <Button label={dialog.okLabel} kind={dialog.destructive ? 'danger' : 'primary'} onPress={() => close(true)} />
                {dialog.cancelLabel ? <Button label={dialog.cancelLabel} kind="ghost" onPress={() => close(false)} /> : null}
              </View>
            </Animated.View>
          </Animated.View>
        ) : null}
      </Modal>
    </Ctx.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDialog must be used inside DialogProvider');
  return ctx;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.xl,
    gap: space.xl,
    alignItems: 'center',
  },
});
