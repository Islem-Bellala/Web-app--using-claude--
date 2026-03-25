// ── Wilaya / Commune (Annex A) ────────────────────────────────────────────────

export interface WilayaInfo {
  code: string;
  name: string;
  zone: string;
  has_split_zones: boolean;
}

export interface CommuneInfo {
  name: string;
  zone: string;
}

// ── Spectrum API ──────────────────────────────────────────────────────────────

export interface SpectrumRequest {
  zone: string;
  site_class: string;
  importance_group: string;
  QF: number;
  R: number;
  T_step?: number;
}

// A single T/Sa_g point as returned by the backend
export interface SpectrumPoint {
  T: number;
  Sa_g: number;
}

// One spectrum branch (horizontal or vertical) from backend response
export interface SpectrumBranch {
  T1: number;
  T2: number;
  T3: number;
  peak: number;
  floor: number;
  points: SpectrumPoint[];
}

// Full backend /spectrum response
export interface SpectrumApiResponse {
  A: number;
  I: number;
  S: number;
  Av: number;
  spectrum_type: string;
  horizontal: SpectrumBranch;
  vertical: SpectrumBranch;
}

// ── Base Shear API ────────────────────────────────────────────────────────────

// Story as sent to the backend (numbers, not strings)
export interface StoryPayload {
  name: string;
  elevation: number;
  weight: number;
}

export interface BaseShearRequest {
  zone: string;
  site_class: string;
  importance_group: string;
  QF: number;
  R: number;
  frame_system: string;
  hn: number;
  T_calculated: number | null;
  stories: StoryPayload[];
}

export interface StoryForce {
  name: string;
  elevation: number;
  weight: number;
  Fi: number;
  ratio: number;
}

export interface BaseShearResult {
  T_emp: number;
  T0: number;
  T_cap: number;
  lambda_coef: number;
  Sad_g: number;
  W: number;
  V: number;
  Ft: number;
  story_forces: StoryForce[];
}
