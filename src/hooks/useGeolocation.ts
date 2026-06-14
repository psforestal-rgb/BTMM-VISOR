import { useEffect, useRef } from 'react';
import type OLMap from 'ol/Map';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import { fromLonLat } from 'ol/proj';
import { useUIStore } from '../store/uiStore';
import { VIEW_PROJ } from '../utils/olLayerFactory';


const GPS_POINT_STYLE = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: 'rgba(51, 153, 255, 0.9)' }),
    stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
  }),
});

export function useGeolocation(mapRef: React.RefObject<OLMap | null>) {
  const { geolocating, setGeolocating } = useUIStore();

  const layerRef = useRef<VectorLayer<Feature<Point>> | null>(null);
  const sourceRef = useRef(new VectorSource<Feature<Point>>());
  const watchIdRef = useRef<number | null>(null);
  const firstFixRef = useRef(true);

  // Add GPS layer (idempotent)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || layerRef.current) return;

    const layer = new VectorLayer<Feature<Point>>({
      source: sourceRef.current,
      style: GPS_POINT_STYLE,
      zIndex: 200,
      properties: { id: '_gps_layer' },
    });
    map.addLayer(layer);
    layerRef.current = layer;
  });

  // Start / stop geolocation watch
  useEffect(() => {
    if (!geolocating) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      sourceRef.current.clear();
      firstFixRef.current = true;
      return;
    }

    if (!navigator.geolocation) {
      alert('La geolocalización no está disponible en este navegador.');
      setGeolocating(false);
      return;
    }

    firstFixRef.current = true;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { longitude, latitude } = pos.coords;
        const coord = fromLonLat([longitude, latitude], VIEW_PROJ);

        sourceRef.current.clear();
        const feat = new Feature<Point>(new Point(coord));
        sourceRef.current.addFeature(feat);

        if (firstFixRef.current && mapRef.current) {
          mapRef.current.getView().animate({ center: coord, zoom: 16, duration: 800 });
          firstFixRef.current = false;
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGeolocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geolocating]);

  // Remove layer on unmount; use getter lambdas to read live ref values at cleanup time
  useEffect(() => {
    const getMap = () => mapRef.current;
    const getLayer = () => layerRef.current;
    const getWatchId = () => watchIdRef.current;
    return () => {
      const watchId = getWatchId();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      const map = getMap();
      const layer = getLayer();
      if (map && layer) map.removeLayer(layer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
