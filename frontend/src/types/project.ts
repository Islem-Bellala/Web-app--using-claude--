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
