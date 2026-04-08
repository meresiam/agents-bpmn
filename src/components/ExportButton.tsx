'use client';

import { useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Download, Image, FileText, Loader2 } from 'lucide-react';
import { ZINC } from '@/lib/diagram-tokens';

interface ExportButtonProps {
  flowRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
}

export function ExportButton({ flowRef, filename = 'fluxograma' }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getViewport = useCallback(() => {
    if (!flowRef.current) return null;
    return flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
  }, [flowRef]);

  const filterNode = useCallback((node: Element) => {
    if (node?.classList?.contains?.('react-flow__minimap')) return false;
    if (node?.classList?.contains?.('react-flow__controls')) return false;
    return true;
  }, []);

  const exportPng = useCallback(async () => {
    const viewport = getViewport();
    if (!viewport) return;
    setLoading(true);
    try {
      const dataUrl = await toPng(viewport, { backgroundColor: ZINC[100], pixelRatio: 2, filter: filterNode });
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
  }, [getViewport, filterNode, filename]);

  const exportPdf = useCallback(async () => {
    const viewport = getViewport();
    if (!viewport) return;
    setLoading(true);
    try {
      const dataUrl = await toPng(viewport, { backgroundColor: ZINC[100], pixelRatio: 2, filter: filterNode });
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve) => (img.onload = resolve));
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width / 2, img.height / 2],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 2, img.height / 2);
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error('Export PDF failed:', err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }, [getViewport, filterNode, filename]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-zinc-200 rounded-bpmn px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 hover:border-zinc-300 transition-all flex items-center gap-1.5 shadow-sm"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Exportar
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-zinc-200 rounded-bpmn shadow-lg overflow-hidden min-w-[148px] z-50">
          <button
            onClick={exportPng}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <Image size={14} />
            PNG (imagem)
          </button>
          <button
            onClick={exportPdf}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-colors border-t border-zinc-100"
          >
            <FileText size={14} />
            PDF (documento)
          </button>
        </div>
      )}
    </div>
  );
}
