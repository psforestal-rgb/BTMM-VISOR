import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import MousePosition from 'ol/control/MousePosition';

const VIEW_PROJ = 'EPSG:5367'; // CR05 / CRTM05

export function useMap(targetRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return;

    mapRef.current = new Map({
      target: targetRef.current,
      view: new View({
        projection: VIEW_PROJ,
        center: fromLonLat([-83.77, 9.60], VIEW_PROJ), // Área Bloque
        zoom: 10,
        minZoom: 2,
        maxZoom: 22,
      }),
      controls: [
        new Zoom(),
        new ScaleLine({ units: 'metric' }),
        new Attribution({ collapsible: true }),
        new FullScreen(),
        new MousePosition({
          projection: VIEW_PROJ,
          coordinateFormat: (coord) =>
            coord
              ? `N ${Math.round(coord[1]).toLocaleString('es-CR')} m   E ${Math.round(coord[0]).toLocaleString('es-CR')} m   CR05`
              : '',
          className: 'ol-mouse-position',
        }),
      ],
      layers: [],
    });

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
    };
  }, [targetRef]);

  return mapRef;
}
