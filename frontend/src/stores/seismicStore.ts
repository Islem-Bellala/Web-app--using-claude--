import { create } from 'zustand';

interface SeismicState {
  // Analysis mode
  twoDir: boolean;

  // QF parameters — single direction
  qfCat: string;
  qfChk: Record<string, boolean>;
  QF: number;

  // QF parameters — two directions
  qfCatX: string;
  qfChkX: Record<string, boolean>;
  QFx: number;
  qfCatY: string;
  qfChkY: Record<string, boolean>;
  QFy: number;

  // R parameters — single direction
  R: number;
  selSys: number;

  // R parameters — two directions
  Rx: number;
  selSysX: number;
  Ry: number;
  selSysY: number;

  // Bracing system key
  frameSys: string;

  // Periods from software or manual (strings — form inputs)
  Tx: string;
  Ty: string;

  // Dynamic analysis results (strings — form inputs)
  Vxd: string;
  Vyd: string;

  // Actions
  setTwoDir: (val: boolean) => void;
  setQFParams: (params: Partial<Pick<SeismicState,
    'qfCat' | 'qfChk' | 'QF' | 'qfCatX' | 'qfChkX' | 'QFx' | 'qfCatY' | 'qfChkY' | 'QFy'>>) => void;
  setRParams: (params: Partial<Pick<SeismicState,
    'R' | 'selSys' | 'Rx' | 'selSysX' | 'Ry' | 'selSysY' | 'frameSys'>>) => void;
  setPeriods: (Tx: string, Ty: string) => void;
  setBaseShear: (Vxd: string, Vyd: string) => void;
  setField: <K extends keyof SeismicState>(key: K, val: SeismicState[K]) => void;
  resetSeismic: () => void;
}

const DEF_QF_CHK: Record<string, boolean> = {
  a1: true, a2: true, a3: true, a4: true,
  b1: true, b2: true, b3: true,
};

const initialState = {
  twoDir: false,

  qfCat: 'a',
  qfChk: DEF_QF_CHK,
  QF: 1.0,

  qfCatX: 'a',
  qfChkX: DEF_QF_CHK,
  QFx: 1.0,
  qfCatY: 'a',
  qfChkY: DEF_QF_CHK,
  QFy: 1.0,

  R: 4.5,
  selSys: 1,

  Rx: 4.5,
  selSysX: 1,
  Ry: 4.5,
  selSysY: 1,

  frameSys: 'ba_with_infill',

  Tx: '',
  Ty: '',
  Vxd: '',
  Vyd: '',
};

export const useSeismicStore = create<SeismicState>((set) => ({
  ...initialState,

  setTwoDir: (val) => set({ twoDir: val }),
  setQFParams: (params) => set((state) => ({ ...state, ...params })),
  setRParams: (params) => set((state) => ({ ...state, ...params })),
  setPeriods: (Tx, Ty) => set({ Tx, Ty }),
  setBaseShear: (Vxd, Vyd) => set({ Vxd, Vyd }),
  setField: (key, val) => set((state) => ({ ...state, [key]: val })),
  resetSeismic: () => set(initialState),
}));
