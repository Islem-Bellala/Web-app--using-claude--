// Actual color object shape used throughout the app (DARK/LIGHT in App.tsx)
export interface AppColors {
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  borderLight: string;
  text: string;
  textSec: string;
  textMuted: string;
  blue: string;
  green: string;
  amber: string;
  red: string;
  purple: string;
  [key: string]: string;  // allow additional custom keys
}

export type ThemeMode = 'dark' | 'light';

export interface ModalBaseProps {
  onClose: () => void;
}
