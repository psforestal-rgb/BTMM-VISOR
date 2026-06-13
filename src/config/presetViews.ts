export interface PresetView {
  id: string;
  title: string;
  center: [number, number]; // [lon, lat] WGS84
  zoom: number;
}

// Costa Rica: Área de Conservación Pacífico Central — Bloque sur
export const PRESET_VIEWS: PresetView[] = [
  {
    id: 'bloque',
    title: 'Área Bloque',
    center: [-83.77, 9.60],
    zoom: 10,
  },
  {
    id: 'tapanti',
    title: 'PN Tapantí',
    center: [-83.78, 9.77],
    zoom: 13,
  },
  {
    id: 'rio-macho',
    title: 'RF Río Macho',
    center: [-83.65, 9.64],
    zoom: 12,
  },
  {
    id: 'quetzales',
    title: 'PN Los Quetzales',
    center: [-83.83, 9.57],
    zoom: 12,
  },
  {
    id: 'cerro-vueltas',
    title: 'RB Cerro Vueltas',
    center: [-83.73, 9.45],
    zoom: 12,
  },
];
