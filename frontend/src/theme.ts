import type { AppColors } from './types'

export const DARK: AppColors = {
  bg: '#06111d',
  surface: '#0d1b2b',
  elevated: '#122338',
  border: '#22384f',
  borderLight: '#3f5770',
  text: '#eff5ff',
  textSec: '#c1d2e6',
  textMuted: '#7f96ad',
  blue: '#56a3ff',
  green: '#27c49a',
  amber: '#ffbb55',
  red: '#ff7d71',
  purple: '#8b9bff',
}

export const LIGHT: AppColors = {
  bg: '#f3f7fb',
  surface: '#ffffff',
  elevated: '#edf3f8',
  border: '#d6e1ec',
  borderLight: '#b9c9da',
  text: '#08111d',
  textSec: '#3f5368',
  textMuted: '#6d8197',
  blue: '#2563eb',
  green: '#0f9f7f',
  amber: '#c87c16',
  red: '#d9493e',
  purple: '#5d68ff',
}

export function getColors(isDark: boolean): AppColors {
  return isDark ? DARK : LIGHT
}
