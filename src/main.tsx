import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { get as getProj } from 'ol/proj';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// CR05 / CRTM05 — Costa Rica's official coordinate reference system (EPSG:5367)
proj4.defs(
  'EPSG:5367',
  '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 ' +
    '+ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);
register(proj4);

// Set valid extent for Costa Rica in CRTM05 (needed for OL tile reprojection)
const crtm05 = getProj('EPSG:5367');
if (crtm05) crtm05.setExtent([271000, 887000, 699000, 1272000]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
