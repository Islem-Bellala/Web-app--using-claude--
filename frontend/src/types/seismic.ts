// Re-export location types (canonical home: project.ts)
export type { WilayaInfo, CommuneInfo } from './project';

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

// ── Combinations API ──────────────────────────────────────────────────────────

export interface CombinationsRequest {
  zone: string;
  group: string;
  psi: number;
}

export interface CombinationOut {
  id: string;
  label: string;
  seismic_id: string;
  ex_coeff: number;
  ey_coeff: number;
  ez_coeff: number;
}

export interface CombinationsResponse {
  psi: number;
  include_vertical: boolean;
  av_i: number;
  combinations: CombinationOut[];
  total_count: number;
}

// ── Verification API — shared story input ─────────────────────────────────────

export interface VerifStoryInput {
  hk: number;
  wg: number;
  wq: number;
  dek_x: number;
  dek_y: number;
  elevation: number;
}

// ── Displacements — §4.5.2 + §5.10 ──────────────────────────────────────────

export interface DisplacementsRequest {
  stories: VerifStoryInput[];
  R: number;
  QF: number;
  structure_type: string;
  non_structural_type: string;
}

export interface StoryDisplacementOut {
  level: number;
  hk: number;
  dek: number;
  dk: number;
  delta_k: number;
  drift: number;
  drift_limit_ne: number;
  damage_value: number;
  damage_limit: number;
  ok_ne: boolean;
  ok_ld: boolean;
}

export interface DirectionDisplacementsOut {
  direction: string;
  R: number;
  QF: number;
  structure_type: string;
  non_structural_type: string;
  stories: StoryDisplacementOut[];
  all_ok_ne: boolean;
  all_ok_ld: boolean;
}

export interface DisplacementsResponse {
  x: DirectionDisplacementsOut;
  y: DirectionDisplacementsOut;
}

// ── P-Delta — §5.9 ───────────────────────────────────────────────────────────

export interface PDeltaRequest {
  stories: VerifStoryInput[];
  R: number;
  QF: number;
  psi: number;
  V_x: number;
  V_y: number;
  Ft_x: number;
  Ft_y: number;
}

export interface StoryPDeltaOut {
  level: number;
  hk: number;
  Pk: number;
  Vk: number;
  delta_k: number;
  theta_k: number;
  verdict: string;
  amplification: number;
}

export interface DirectionPDeltaOut {
  direction: string;
  stories: StoryPDeltaOut[];
  all_ok: boolean;
  max_theta: number;
}

export interface PDeltaResponse {
  x: DirectionPDeltaOut;
  y: DirectionPDeltaOut;
}

// ── Overturning — §5.5 ────────────────────────────────────────────────────────

export interface OverturningRequest {
  stories: VerifStoryInput[];
  V_x: number;
  V_y: number;
  Ft_x: number;
  Ft_y: number;
  psi: number;
  lx: number;
  ly: number;
  mu: number;
  W_total: number;
}

export interface DirectionOverturningOut {
  direction: string;
  V: number;
  M_renvers: number;
  M_stab: number;
  coeff_renvers: number;
  ok_renvers: boolean;
  F_glissement: number;
  F_resistance: number;
  coeff_glissement: number;
  ok_glissement: boolean;
}

export interface OverturningResponse {
  x: DirectionOverturningOut;
  y: DirectionOverturningOut;
}
