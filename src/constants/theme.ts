import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    background: '#eef2ef',
    surface: '#ffffff',
    text: '#14211b',
    muted: '#5d6e66',
    line: '#d6dfda',
    pitch: '#0d7a52',
    pitchSoft: '#dcefe6',
    clay: '#c8552c',
    claySoft: '#f7e3da',
    ball: '#c6d92b',
  },
  dark: {
    background: '#0f1613',
    surface: '#18221d',
    text: '#e6efe9',
    muted: '#93a49b',
    line: '#2a3832',
    pitch: '#3fbf8a',
    pitchSoft: '#1d3a2e',
    clay: '#ef7d52',
    claySoft: '#3d2419',
    ball: '#d4e64a',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export function useColors(): Palette {
  return Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

export const SportColor = {
  tennis: '#c8552c',
  soccer: '#0d7a52',
  basketball: '#d9772b',
  golf: '#3f7f3a',
  swimming: '#1f6fae',
} as const;

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
