import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';

export function useMap(targetRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return;

    mapRef.current = new Map({
      target: targetRef.current,
      view: new View({
        center: fromLonLat([-83.77, 9.60]), // Área Bloque — Costa Rica
        zoom: 10,
        minZoom: 2,
        maxZoom: 22,
      }),
      controls: [
        new Zoom(),
        new ScaleLine({ units: 'metric' }),
        new Attribution({ collapsible: true }),
        new FullScreen(),
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
