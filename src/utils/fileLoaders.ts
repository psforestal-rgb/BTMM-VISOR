import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import type { GeoJSONLayerConfig, KMLLayerConfig } from '../types/layer';

const geoJSONFormat = new GeoJSON();
const kmlFormat = new KML();

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = () => reject(new Error(`No se pudo leer el archivo: ${file.name}`));
    reader.readAsText(file);
  });
}

export async function loadGeoJSONFile(file: File): Promise<GeoJSONLayerConfig> {
  const text = await readFileAsText(file);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${file.name} no es un JSON válido`);
  }
  try {
    geoJSONFormat.readFeatures(data, { featureProjection: 'EPSG:3857' });
  } catch {
    throw new Error(`${file.name} no es un GeoJSON válido`);
  }
  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.(geo)?json$/i, ''),
    type: 'geojson',
    data,
    visible: true,
    opacity: 1,
    zIndex: 10,
  };
}

export async function loadKMLFile(file: File): Promise<KMLLayerConfig> {
  const text = await readFileAsText(file);
  try {
    kmlFormat.readFeatures(text, { featureProjection: 'EPSG:3857' });
  } catch {
    throw new Error(`${file.name} no es un KML válido`);
  }
  return {
    id: crypto.randomUUID(),
    title: file.name.replace(/\.kml$/i, ''),
    type: 'kml',
    data: text,
    visible: true,
    opacity: 1,
    zIndex: 10,
  };
}

export async function loadLayerFile(
  file: File
): Promise<GeoJSONLayerConfig | KMLLayerConfig> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'kml') return loadKMLFile(file);
  if (ext === 'json' || ext === 'geojson') return loadGeoJSONFile(file);
  throw new Error(`Formato no soportado: .${ext}. Use .geojson, .json o .kml`);
}
