import GeoJSON from 'ol/format/GeoJSON';
import KML from 'ol/format/KML';
import GPX from 'ol/format/GPX';
import WKB from 'ol/format/WKB';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { get as getProjection } from 'ol/proj';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type { GeoJSONLayerConfig, KMLLayerConfig, LayerConfig } from '../types/layer';
import type { FeatureCollection } from 'geojson';
import type { Database } from 'sql.js';
import { VIEW_PROJ } from './olLayerFactory';

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
  // Features are in VIEW_PROJ (EPSG:5367); write to WGS84 for storage
  const data = geoJSONFmt.writeFeaturesObject(features, {
    featureProjection: VIEW_PROJ,
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
      featureProjection: VIEW_PROJ,
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

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function ensureGPKGProjection(db: Database, srsId: number): string {
  const conventionalCode = `EPSG:${srsId}`;
  if (getProjection(conventionalCode)) return conventionalCode;

  const columns = db.exec('PRAGMA table_info("gpkg_spatial_ref_sys")');
  const columnNames = (columns[0]?.values ?? []).map((row) => String(row[1]));
  const definitionColumn = columnNames.includes('definition_12_063')
    ? 'definition_12_063'
    : 'definition';

  const srsRows = db.exec(
    `SELECT organization, organization_coordsys_id, ${quoteIdentifier(definitionColumn)}, definition ` +
    `FROM gpkg_spatial_ref_sys WHERE srs_id = ${Math.trunc(srsId)}`
  );
  const row = srsRows[0]?.values[0];
  if (!row) throw new Error(`No existe la definición del SRS ${srsId}`);

  const organization = String(row[0] ?? '').toUpperCase();
  const organizationId = Number(row[1]);
  const preferredDefinition = String(row[2] ?? '');
  const fallbackDefinition = String(row[3] ?? '');
  const definition = preferredDefinition !== 'undefined' && preferredDefinition.trim()
    ? preferredDefinition
    : fallbackDefinition;

  if (!definition || definition === 'undefined') {
    throw new Error(`El SRS ${srsId} no incluye una definición transformable`);
  }

  const projectionCode = organization && Number.isFinite(organizationId)
    ? `${organization}:${organizationId}`
    : `GPKG:${srsId}`;

  try {
    proj4.defs(projectionCode, definition);
    register(proj4);
  } catch {
    throw new Error(`No se pudo registrar la proyección ${projectionCode}`);
  }

  if (!getProjection(projectionCode)) {
    throw new Error(`La proyección ${projectionCode} no es compatible`);
  }
  return projectionCode;
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
      "SELECT c.table_name, g.column_name, g.srs_id " +
      "FROM gpkg_contents c JOIN gpkg_geometry_columns g ON g.table_name = c.table_name " +
      "WHERE c.data_type = 'features'"
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
  const projectionErrors: string[] = [];
  const baseName = file.name.replace(/\.gpkg$/i, '');

  for (const row of tableRows) {
    const tableName = row[0] as string;
    const geomCol = (row[1] as string | null) ?? 'geom';
    const srsId = (row[2] as number | null) ?? 4326;
    let dataProjection: string;
    try {
      dataProjection = ensureGPKGProjection(db, srsId);
    } catch (error) {
      projectionErrors.push(`${tableName}: ${(error as Error).message}`);
      continue;
    }

    const infoRes = db.exec(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
    const allCols = (infoRes[0]?.values ?? []).map((r) => r[1] as string);
    const attrCols = allCols.filter((c) => c !== geomCol);

    const selectCols = [geomCol, ...attrCols].map(quoteIdentifier).join(', ');
    const dataRes = db.exec(`SELECT ${selectCols} FROM ${quoteIdentifier(tableName)}`);
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
          dataProjection,
          featureProjection: VIEW_PROJ,
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
  if (!layers.length && projectionErrors.length) {
    throw new Error(`No se pudieron cargar las proyecciones del GeoPackage: ${projectionErrors.join('; ')}`);
  }
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
