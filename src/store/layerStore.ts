import { create } from 'zustand';
import type { BingLayerConfig, LayerConfig, XYZLayerConfig } from '../types/layer';
import { BASE_MAPS } from '../config/baseMaps';

type BaseMapConfig = XYZLayerConfig | BingLayerConfig;

interface LayerStore {
  baseMapId: string;
  baseMaps: BaseMapConfig[];
  overlays: LayerConfig[];
  setBaseMap: (id: string) => void;
  addOverlay: (layer: LayerConfig) => void;
  removeOverlay: (id: string) => void;
  toggleOverlay: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  reorderOverlays: (fromIndex: number, toIndex: number) => void;
}

export const useLayerStore = create<LayerStore>((set) => ({
  baseMapId: 'osm',
  baseMaps: BASE_MAPS,
  overlays: [],

  setBaseMap: (id) =>
    set((state) => ({
      baseMapId: id,
      baseMaps: state.baseMaps.map((bm) => ({ ...bm, visible: bm.id === id })),
    })),

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
}));
