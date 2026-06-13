import { create } from 'zustand';

export type MeasureMode = 'off' | 'distance' | 'area';

interface UIStore {
  measureMode: MeasureMode;
  geolocating: boolean;
  tableLayerId: string | null;
  pendingExport: boolean;
  setMeasureMode: (mode: MeasureMode) => void;
  setGeolocating: (v: boolean) => void;
  setTableLayerId: (id: string | null) => void;
  triggerExport: () => void;
  clearExport: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  measureMode: 'off',
  geolocating: false,
  tableLayerId: null,
  pendingExport: false,
  setMeasureMode: (mode) => set({ measureMode: mode }),
  setGeolocating: (v) => set({ geolocating: v }),
  setTableLayerId: (id) => set({ tableLayerId: id }),
  triggerExport: () => set({ pendingExport: true }),
  clearExport: () => set({ pendingExport: false }),
}));
