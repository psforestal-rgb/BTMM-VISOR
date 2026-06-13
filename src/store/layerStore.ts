import { create } from 'zustand';
import type { LayerConfig, XYZLayerConfig } from '../types/layer';
import { BASE_MAPS, LABELS_OVERLAY } from '../config/baseMaps';

export interface PendingView {
  center: [number, number]; // [lon, lat] WGS84
  zoom: number;
}

interface LayerStore {
  baseMapId: string;
  baseMaps: XYZLayerConfig[];
  labelsVisible: boolean;
  overlays: LayerConfig[];
  pendingView: PendingView | null;
  setBaseMap: (id: string) => void;
  toggleLabels: () => void;
  addOverlay: (layer: LayerConfig) => void;
  removeOverlay: (id: string) => void;
  toggleOverlay: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  reorderOverlays: (fromIndex: number, toIndex: number) => void;
  flyTo: (center: [number, number], zoom: number) => void;
  clearPendingView: () => void;
}

export const useLayerStore = create<LayerStore>((set) => ({
  baseMapId: 'esri-satellite',
  baseMaps: BASE_MAPS,
  labelsVisible: false,
  overlays: [],
  pendingView: null,

  setBaseMap: (id) =>
    set((state) => ({
      baseMapId: id,
      baseMaps: state.baseMaps.map((bm) => ({ ...bm, visible: bm.id === id })),
    })),

  toggleLabels: () =>
    set((state) => ({ labelsVisible: !state.labelsVisible })),

  addOverlay: (layer) =>
    set((state) => ({ overlays: [...state.overlays, layer] })),

  removeOverlay: (id) =>
    set((state) => ({ overlays: state.overlays.filter((l) => l.id !== id) })),

  toggleOverlay: (id) =>
    set((state) => ({
      overlays: state.overlays.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
    })),

  setOpacity: (id, opacity) =>
    set((state) => ({
      overlays: state.overlays.map((l) =>
        l.id === id ? { ...l, opacity } : l
      ),
    })),

  reorderOverlays: (fromIndex, toIndex) =>
    set((state) => {
      const arr = [...state.overlays];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return { overlays: arr };
    }),

  flyTo: (center, zoom) => set({ pendingView: { center, zoom } }),
  clearPendingView: () => set({ pendingView: null }),
}));

export const selectLabelsConfig = (state: LayerStore): XYZLayerConfig => ({
  ...LABELS_OVERLAY,
  visible: state.labelsVisible,
});
