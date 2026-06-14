import { useEffect } from 'react';
import type OLMap from 'ol/Map';
import { useUIStore } from '../store/uiStore';

export function useExportPng(mapRef: React.RefObject<OLMap | null>) {
  const { pendingExport, clearExport } = useUIStore();

  useEffect(() => {
    if (!pendingExport) return;
    clearExport(); // always clear so pendingExport never stays true
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.once('rendercomplete', () => {
      try {
        const mapCanvas = document.createElement('canvas');
        const size = map.getSize();
        if (!size) return;
        mapCanvas.width = size[0];
        mapCanvas.height = size[1];
        const ctx = mapCanvas.getContext('2d')!;

        const canvases = map
          .getViewport()
          .querySelectorAll<HTMLCanvasElement>('.ol-layer canvas, canvas.ol-layer');

        canvases.forEach((canvas) => {
          if (canvas.width === 0) return;
          const parentEl = canvas.parentElement;
          const opacity = parentEl ? parseFloat(getComputedStyle(parentEl).opacity || '1') : 1;
          ctx.globalAlpha = isNaN(opacity) ? 1 : opacity;

          const transform = canvas.style.transform;
          const matrix = transform.match(/^matrix\(([^)]*)\)$/)?.[1]?.split(',').map(Number);
          if (matrix && matrix.length === 6) {
            ctx.setTransform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
          } else {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
          }
          ctx.drawImage(canvas, 0, 0);
        });

        ctx.globalAlpha = 1;
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        mapCanvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ts = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '');
          a.download = `btmm-visor_${ts}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        });
      } catch (e) {
        console.warn('Exportar PNG falló (posiblemente tiles CORS):', e);
        alert('No se pudo exportar el mapa. Las capas de teselas pueden tener restricciones CORS.');
      }
    });

    map.renderSync();
  }, [pendingExport, clearExport, mapRef]);
}
