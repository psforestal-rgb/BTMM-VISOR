import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LayerConfig, LayerStyle, VectorLayerConfig, XYZLayerConfig } from '../types/layer';
import { BASE_MAPS, LABELS_OVERLAY } from '../config/baseMaps';
import { indexedDBStorage } from './indexedDBStorage';

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
  pendingFit: string | null;
  setBaseMap: (id: string) => void;
  toggleLabels: () => void;
  addOverlay: (layer: LayerConfig) => void;
  removeOverlay: (id: string) => void;
  toggleOverlay: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  reorderOverlays: (fromIndex: number, toIndex: number) => void;
  updateLayerStyle: (id: string, style: Partial<LayerStyle>) => void;
  flyTo: (center: [number, number], zoom: number) => void;
  clearPendingView: () => void;
  zoomToLayer: (id: string) => void;
  clearPendingFit: () => void;
}

export const useLayerStore = create<LayerStore>()(
  persist(
    (set) => ({
      baseMapId: 'esri-satellite',
      baseMaps: BASE_MAPS,
      labelsVisible: false,
      overlays: [],
      pendingView: null,
      pendingFit: null,

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

      updateLayerStyle: (id, style) =>
        set((state) => {
          const overlays = state.overlays.map((l) => {
            if (l.id !== id) return l;
            if (l.type !== 'geojson' && l.type !== 'kml' && l.type !== 'realtime') return l;
            const vec = l as VectorLayerConfig;
            return { ...vec, layerStyle: { ...(vec.layerStyle ?? {}), ...style } } as LayerConfig;
          });
          return { overlays };
        }),

      flyTo: (center, zoom) => set({ pendingView: { center, zoom } }),
      clearPendingView: () => set({ pendingView: null }),
      zoomToLayer: (id) => set({ pendingFit: id }),
      clearPendingFit: () => set({ pendingFit: null }),
    }),
    {
      name: 'btmm-visor-v1',
      partialize: (state) => ({
        baseMapId: state.baseMapId,
        labelsVisible: state.labelsVisible,
        overlays: state.overlays,
      }),
      storage: createJSONStorage(() => indexedDBStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Rehydration is already committed by the time this callback runs,
        // so use setState to push corrections rather than mutating state directly.
        useLayerStore.setState({
          baseMaps: BASE_MAPS.map((bm) => ({
            ...bm,
            visible: bm.id === state.baseMapId,
          })),
          pendingView: null,
          pendingFit: null,
        });
      },
    }
  )
);

export const selectLabelsConfig = (state: LayerStore): XYZLayerConfig => ({
  ...LABELS_OVERLAY,
  visible: state.labelsVisible,
});
