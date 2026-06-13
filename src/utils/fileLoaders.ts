import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import GPX from 'ol/format/GPX';
import WKB from 'ol/format/WKB';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { GeoJSONLayerConfig, KMLLayerConfig, LayerConfig } from '../types/layer';
import type { FeatureCollection } from 'geojson';

const geoJSONFmt = new GeoJSON();
const kmlFmt = new KML({ extractStyles: true });
const gpxFmt = new GPX();
const wkbFmt = new WKB();

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target!.result as string);
    r.onerror = () => reject(new Error(`No se pudo leer "${file.name}"`));
    r.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target!.result as ArrayBuffer);
    r.onerror = () => reject(new Error(`No se pudo leer "${file.name}"`));
    r.readAsArrayBuffer(file);
  });
}

function featuresToConfig(features: Feature<Geometry>[], title: string): GeoJSONLayerConfig {
  const data = geoJSONFmt.writeFeaturesObject(features, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326',
  });
  return { id: crypto.randomUUID(), title, type: 'geojson', data, visible: true, opacity: 1, zIndex: 10 };
}

// ── GeoJSON ──────────────────────────────────────────────────────────────────

export async function loadGeoJSONFile(file: File): Promise<GeoJSONLayerConfig[]> {
  const text = await readAsText(file);
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error(`"${file.name}" no es JSON válido`); }
  try { geoJSONFmt.readFeatures(parsed, { featureProjection: 'EPSG:3857' }); }
  catch { throw new Error(`"${file.name}" no es un GeoJSON válido`); }
  return [{
    id: crypto.randomUUID(),
    title: file.name.replace(/\.(geo)?json$/i, ''),
    type: 'geojson',
    data: parsed,
    visible: true,
    opacity: 1,
    zIndex: 10,
  }];
}

// ── KML ──────────────────────────────────────────────────────────────────────

export async function loadKMLFile(file: File): Promise<KMLLayerConfig[]> {
  const data = await readAsText(file);
  try { kmlFmt.readFeatures(data, { featureProjection: 'EPSG:3857' }); }
  catch { throw new Error(`"${file.name}" no es un KML válido`); }
  return [{
    id: crypto.randomUUID(),
    title: file.name.replace(/\.kml$/i, ''),
    type: 'kml',
    data,
    visible: true,
    opacity: 1,
    zIndex: 10,
  }];
}

// ── GPX ──────────────────────────────────────────────────────────────────────

export async function loadGPXFile(file: File): Promise<GeoJSONLayerConfig[]> {
  const text = await readAsText(file);
  let features: Feature<Geometry>[];
  try {
    features = gpxFmt.readFeatures(text, {
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:3857',
    }) as Feature<Geometry>[];
  } catch { throw new Error(`"${file.name}" no es un GPX válido`); }
  if (!features.length) throw new Error(`"${file.name}" no contiene geometrías`);
  return [featuresToConfig(features, file.name.replace(/\.gpx$/i, ''))];
}

// ── Shapefile (ZIP) ───────────────────────────────────────────────────────────

export async function loadShapeFile(file: File): Promise<GeoJSONLayerConfig[]> {
  const buffer = await readAsArrayBuffer(file);
  const { default: shp } = await import('shpjs');
  let result: FeatureCollection | FeatureCollection[];
  try {
    result = await shp(buffer) as FeatureCollection | FeatureCollection[];
  } catch (e) {
    throw new Error(`No se pudo leer el shapefile: ${(e as Error).message}`);
  }
  const collections = Array.isArray(result) ? result : [result];
  const baseName = file.name.replace(/\.zip$/i, '');
  return collections.map((col, i) => ({
    id: crypto.randomUUID(),
    title: collections.length > 1 ? `${baseName} (${i + 1})` : baseName,
    type: 'geojson' as const,
    data: col,
    visible: true,
    opacity: 1,
    zIndex: 10,
  }));
}

// ── GeoPackage ───────────────────────────────────────────────────────────────

function parseGPKGWKBOffset(bytes: Uint8Array): number {
  // GPKG header: 2 magic + 1 version + 1 flags + 4 srs_id = 8 bytes
  // flags bits 1–3 = envelope type → additional bytes
  const flags = bytes[3];
  const envType = (flags >> 1) & 0x07;
  const envBytes = [0, 32, 48, 48, 64][envType] ?? 0;
  return 8 + envBytes;
}

export async function loadGPKGFile(file: File): Promise<GeoJSONLayerConfig[]> {
  const buffer = await readAsArrayBuffer(file);

  // WASM loaded from CDN to avoid ~1 MB in the bundle
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: (f: string) =>
      `https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/${f}`,
  });

  const db = new SQL.Database(new Uint8Array(buffer));

  let tableRows: (string | number | bigint | Uint8Array | null)[][];
  try {
    const res = db.exec(
      "SELECT table_name, srs_id FROM gpkg_contents WHERE data_type = 'features'"
    );
    tableRows = res[0]?.values ?? [];
  } catch {
    db.close();
    throw new Error(`"${file.name}" no parece ser un GeoPackage válido`);
  }

  if (!tableRows.length) {
    db.close();
    throw new Error(`"${file.name}" no contiene capas vectoriales`);
  }

  const layers: GeoJSONLayerConfig[] = [];
  const baseName = file.name.replace(/\.gpkg$/i, '');

  for (const row of tableRows) {
    const tableName = row[0] as string;
    const srsId = (row[1] as number | null) ?? 4326;

    const geomRes = db.exec(
      `SELECT column_name FROM gpkg_geometry_columns WHERE table_name = '${tableName}'`
    );
    const geomCol = (geomRes[0]?.values[0]?.[0] as string | undefined) ?? 'geom';

    const infoRes = db.exec(`PRAGMA table_info("${tableName}")`);
    const allCols = (infoRes[0]?.values ?? []).map((r) => r[1] as string);
    const attrCols = allCols.filter((c) => c !== geomCol);

    const selectCols = [geomCol, ...attrCols].map((c) => `"${c}"`).join(', ');
    const dataRes = db.exec(`SELECT ${selectCols} FROM "${tableName}"`);
    if (!dataRes.length) continue;

    const features: Feature<Geometry>[] = [];
    for (const dataRow of dataRes[0].values) {
      const geomVal = dataRow[0];
      if (!(geomVal instanceof Uint8Array)) continue;

      try {
        const wkbOffset = parseGPKGWKBOffset(geomVal);
        // Slice as ArrayBuffer (avoiding SharedArrayBuffer)
        const wkb: ArrayBuffer = geomVal.slice(wkbOffset).buffer as ArrayBuffer;
        const geom = wkbFmt.readGeometry(wkb, {
          dataProjection: `EPSG:${srsId}`,
          featureProjection: 'EPSG:3857',
        }) as Geometry | null;
        if (!geom) continue;

        const props: Record<string, unknown> = {};
        attrCols.forEach((col, i) => { props[col] = dataRow[i + 1]; });

        const feat = new Feature<Geometry>(geom);
        feat.setProperties(props);
        features.push(feat);
      } catch { /* skip bad geometry */ }
    }

    if (!features.length) continue;
    layers.push(featuresToConfig(
      features,
      tableRows.length > 1 ? `${baseName} — ${tableName}` : baseName
    ));
  }

  db.close();
  if (!layers.length) throw new Error(`No se encontraron features en "${file.name}"`);
  return layers;
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function loadLayerFile(file: File): Promise<LayerConfig[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'geojson':
    case 'json':
      return loadGeoJSONFile(file);
    case 'kml':
      return loadKMLFile(file);
    case 'gpx':
      return loadGPXFile(file);
    case 'zip':
      return loadShapeFile(file);
    case 'gpkg':
      return loadGPKGFile(file);
    default:
      throw new Error(
        `Formato no soportado: .${ext ?? '?'}  (Use .geojson, .kml, .gpx, .zip o .gpkg)`
      );
  }
}
