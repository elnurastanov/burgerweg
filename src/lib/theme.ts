import { useColorScheme } from 'react-native';

import { useApp } from '@/lib/store';

const light = {
  bg: '#F5F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF1EC',
  text: '#1F2A2E',
  textMuted: '#6B7A7F',
  border: '#E6E2DA',
  primary: '#4F8A7B',
  primarySoft: '#E1EEEA',
  onPrimary: '#FFFFFF',
  accent: '#C29A5B',
  accentSoft: '#F5ECDD',
  success: '#4F9A6C',
  successSoft: '#E3F1E8',
  danger: '#C4665E',
  dangerSoft: '#F7E6E3',
  shadow: 'rgba(31, 42, 46, 0.06)',
};

const dark: typeof light = {
  bg: '#111816',
  surface: '#19221F',
  surfaceAlt: '#1F2A27',
  text: '#E8EEEC',
  textMuted: '#93A39F',
  border: '#26312E',
  primary: '#7FBFAE',
  primarySoft: '#22332F',
  onPrimary: '#0E1513',
  accent: '#D8B97F',
  accentSoft: '#33291A',
  success: '#86C49C',
  successSoft: '#1E3127',
  danger: '#E39A92',
  dangerSoft: '#3A2523',
  shadow: 'rgba(0, 0, 0, 0.25)',
};

export type Palette = typeof light;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const maxContentWidth = 720;

export function useTheme() {
  const system = useColorScheme();
  const { settings } = useApp();
  const mode = settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.theme;
  return { c: mode === 'dark' ? dark : light, dark: mode === 'dark' };
}
