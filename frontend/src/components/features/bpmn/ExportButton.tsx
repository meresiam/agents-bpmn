'use client';

import { useCallback, useState } from 'react';
import { Download, Image, FileText, FileStack, Loader2 } from 'lucide-react';
import { useReactFlow, getRectOfNodes, getTransformForBounds } from 'reactflow';
import { ZINC } from '@/lib/diagram-tokens';

interface ExportButtonProps {
  flowRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
}

const TARGET_RESOLUTION_PX = 3200;
const MARGIN_FRACTION = 0.06;
const PRINT_DPI = 150;
const MM_PER_PX = 25.4 / PRINT_DPI;

export function ExportButton({ flowRef, filename = 'fluxograma' }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getNodes } = useReactFlow();

  const filterNode = useCallback((node: Element) => {
    if (node?.classList?.contains?.('react-flow__minimap')) return false;
    if (node?.classList?.contains?.('react-flow__controls')) return false;
    if ((node as HTMLElement)?.dataset?.exportExclude === 'true') return false;
    return true;
  }, []);

  const captureFullGraph = useCallback(async () => {
    const viewport = flowRef.current?.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewport) throw new Error('Viewport não encontrado');

    const nodes = getNodes();
    if (nodes.length === 0) throw new Error('Sem nodes para exportar');

    const bounds = getRectOfNodes(nodes);
    const aspect = bounds.width / bounds.height;
    const imageWidth =
      aspect >= 1 ? TARGET_RESOLUTION_PX : Math.round(TARGET_RESOLUTION_PX * aspect);
    const imageHeight =
      aspect >= 1 ? Math.round(TARGET_RESOLUTION_PX / aspect) : TARGET_RESOLUTION_PX;

    const [x, y, zoom] = getTransformForBounds(
      bounds,
      imageWidth,
      imageHeight,
      0.05,
      4,
      MARGIN_FRACTION
    );

    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(viewport, {
      backgroundColor: ZINC[100],
      pixelRatio: 1,
      width: imageWidth,
      height: imageHeight,
      filter: filterNode,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    });

    return { dataUrl, width: imageWidth, height: imageHeight };
  }, [flowRef, getNodes, filterNode]);

  const exportPng = useCallback(async () => {
    setLoading(true);
    try {
      const { dataUrl } = await captureFullGraph();
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export PNG failed:', err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, [captureFullGraph, filename]);

  const exportPdfA3 = useCallback(async () => {
    setLoading(true);
    try {
      const { dataUrl, width, height } = await captureFullGraph();
      const { default: jsPDF } = await import('jspdf');

      const pageW = 420;
      const pageH = 297;
      const margin = 10;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      const imgAspect = width / height;
      let renderW = availW;
      let renderH = availW / imgAspect;
      if (renderH > availH) {
        renderH = availH;
        renderW = availH * imgAspect;
      }
      const offsetX = (pageW - renderW) / 2;
      const offsetY = (pageH - renderH) / 2;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, renderW, renderH);
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Export PDF A3 failed:', err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, [captureFullGraph, filename]);

  const exportPdfPaginated = useCallback(async () => {
    setLoading(true);
    try {
      const { dataUrl, width, height } = await captureFullGraph();
      const { default: jsPDF } = await import('jspdf');

      const pageW = 297;
      const pageH = 210;
      const margin = 10;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      const pxPerMm = 1 / MM_PER_PX;
      const tilePxW = availW * pxPerMm;
      const tilePxH = availH * pxPerMm;

      const cols = Math.max(1, Math.ceil(width / tilePxW));
      const rows = Math.max(1, Math.ceil(height / tilePxH));

      const img = new window.Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar imagem capturada'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(tilePxW);
      canvas.height = Math.ceil(tilePxH);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D não suportado');

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      let first = true;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = ZINC[100];
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const srcX = c * tilePxW;
          const srcY = r * tilePxH;
          const srcW = Math.min(tilePxW, width - srcX);
          const srcH = Math.min(tilePxH, height - srcY);
          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

          const tileData = canvas.toDataURL('image/png');
          if (!first) pdf.addPage('a4', 'landscape');

          pdf.addImage(tileData, 'PNG', margin, margin, availW, availH);

          pdf.setFontSize(8);
          pdf.setTextColor(120);
          pdf.text(
            `Página ${r * cols + c + 1} de ${rows * cols}  ·  Linha ${r + 1}/${rows}  Coluna ${c + 1}/${cols}`,
            margin,
            pageH - 4
          );

          first = false;
        }
      }

      pdf.save(`${filename}-paginado.pdf`);
    } catch (err) {
      console.error('Export PDF paginado failed:', err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, [captureFullGraph, filename]);

  return (
    <div className="relative" data-export-exclude="true">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="bg-white border border-zinc-200 rounded-bpmn px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Exportar
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-zinc-200 rounded-bpmn shadow-lg overflow-hidden min-w-[200px] z-50">
          <button
            onClick={exportPng}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors text-left"
          >
            <Image size={14} />
            <span className="flex-1">
              PNG <span className="text-zinc-500 font-normal">(alta resolução)</span>
            </span>
          </button>
          <button
            onClick={exportPdfA3}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors border-t border-zinc-100 text-left"
          >
            <FileText size={14} />
            <span className="flex-1">
              PDF <span className="text-zinc-500 font-normal">(A3, 1 página)</span>
            </span>
          </button>
          <button
            onClick={exportPdfPaginated}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors border-t border-zinc-100 text-left"
          >
            <FileStack size={14} />
            <span className="flex-1">
              PDF <span className="text-zinc-500 font-normal">(A4 paginado, legível)</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
