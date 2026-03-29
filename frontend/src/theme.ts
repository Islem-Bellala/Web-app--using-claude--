import type { AppColors } from './types'

export const DARK: AppColors = {
  bg:'#020817', surface:'#0a1628', elevated:'#0f172a',
  border:'#1e293b', borderLight:'#475569',
  text:'#f1f5f9', textSec:'#cbd5e1', textMuted:'#94a3b8',
  blue:'#60a5fa', green:'#34d399', amber:'#fbbf24',
  red:'#f87171', purple:'#c4b5fd',
}

export const LIGHT: AppColors = {
  bg:'#f8fafc', surface:'#ffffff', elevated:'#f1f5f9',
  border:'#e2e8f0', borderLight:'#cbd5e1',
  text:'#0f172a', textSec:'#475569', textMuted:'#94a3b8',
  blue:'#2563eb', green:'#059669', amber:'#d97706',
  red:'#dc2626', purple:'#7c3aed',
}

export function getColors(isDark: boolean): AppColors {
  return isDark ? DARK : LIGHT
}
