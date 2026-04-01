// ── Project persistence (API / JSONB blob) ────────────────────────────────────

export interface ProjectSummary {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

/** Shape of the JSONB state blob stored on the backend. */
export interface ProjectState {
  project: {
    wilayaCode: string
    commune: string
    zone: string
    site: string
    group: string
    projectName: string
    engineer: string
    reference: string
    date: string
    psiCase: number
    psi: number
  }
  seismic: {
    twoDir: boolean
    QF: number; QFx: number; QFy: number
    R: number;  Rx: number;  Ry: number
    selSys: number; selSysX: number; selSysY: number
    qfCat: string; qfChk: Record<string, boolean>
    qfCatX: string; qfChkX: Record<string, boolean>
    qfCatY: string; qfChkY: Record<string, boolean>
    frameSys: string
    Tx: string; Ty: string
    Vxd: string; Vyd: string
  }
  structural: {
    stories: Story[]
  }
}

export interface ProjectFull extends ProjectSummary {
  state: ProjectState | null
}

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

// Story as stored in state — elevation/weight/drx/dry are strings (form input values)
export interface Story {
  id: number;
  name: string;
  elevation: string;
  weight: string;
  drx: string;
  dry: string;
}

// Full global params object (DEFAULT_PARAMS shape from App.tsx)
export interface GlobalParams {
  // Block 1 — Identification
  projectName: string;
  engineer: string;
  reference: string;
  date: string;

  // Block 2 — Seismic
  wilayaCode: string;
  commune: string;
  zone: string;       // derived from wilaya + commune
  site: string;       // "S1" | "S2" | "S3" | "S4"
  group: string;      // "1A" | "1B" | "2" | "3"
  twoDir: boolean;    // two-direction analysis mode
  frameSys: string;   // bracing system key (e.g. "ba_with_infill")

  // Single direction
  QF: number;
  R: number;
  selSys: number;
  qfCat: string;
  qfChk: Record<string, boolean>;

  // Two directions
  QFx: number;
  Rx: number;
  selSysX: number;
  qfCatX: string;
  qfChkX: Record<string, boolean>;
  QFy: number;
  Ry: number;
  selSysY: number;
  qfCatY: string;
  qfChkY: Record<string, boolean>;

  // Block 3 — Geometry
  stories: Story[];

  // Block 4 — Dynamic analysis results (stored as strings from form inputs)
  Tx: string;
  Ty: string;
  Vxd: string;
  Vyd: string;
}
