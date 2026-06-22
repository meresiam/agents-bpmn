import type { PopContent } from '@/services/pop.service';
import { popImageSrc } from '@/services/pop.service';

/** Baixa uma imagem (endpoint público) e converte em dataURL pra embutir no PDF. */
async function fetchImageDataUrl(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(popImageSrc(url));
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = dataUrl;
    });
    return { data: dataUrl, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

/**
 * Gera o PDF do POP (Epic 6.C.2) — texto estruturado + ilustrações por passo.
 * Usa jsPDF (já é dependência), igual ao export de GAP.
 */
export async function exportPopPdf(content: PopContent): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const line = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) => {
    const { size = 10, bold = false, color = [30, 30, 30], gap = 1.5 } = opts;
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    const wrapped = pdf.splitTextToSize(text, contentW) as string[];
    for (const w of wrapped) {
      ensureSpace(size * 0.5);
      pdf.text(w, margin, y);
      y += size * 0.42 + gap;
    }
  };

  const section = (label: string) => {
    y += 2;
    line(label, { size: 12, bold: true, color: [88, 80, 236] });
    y += 0.5;
  };

  // Cabeçalho
  line(content.titulo || 'POP', { size: 18, bold: true, color: [88, 80, 236] });
  y += 1;
  line('Procedimento Operacional Padrão · Bravy BPMN · AILA', { size: 10, color: [120, 120, 120] });
  y += 2;

  if (content.objetivo) {
    section('Objetivo');
    line(content.objetivo, { color: [50, 50, 50] });
  }
  if (content.escopo) {
    section('Escopo');
    line(content.escopo, { color: [50, 50, 50] });
  }

  if (content.responsaveis?.length) {
    section('Responsáveis');
    content.responsaveis.forEach((r) =>
      line(`• ${r.papel}${r.descricao ? ` — ${r.descricao}` : ''}`, { color: [50, 50, 50] }),
    );
  }

  if (content.materiais?.length) {
    section('Materiais e sistemas');
    content.materiais.forEach((m) => line(`• ${m}`, { color: [50, 50, 50] }));
  }

  // Passos (com imagem quando houver)
  section(`Passos (${content.passos.length})`);
  for (const p of content.passos) {
    ensureSpace(24);
    y += 2;
    pdf.setDrawColor(225, 225, 225);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;

    line(`${p.ordem}. ${p.acao}`, { size: 11, bold: true });
    if (p.responsavel) line(`Responsável: ${p.responsavel}`, { size: 9, color: [110, 110, 110] });
    if (p.entrada) line(`Entrada: ${p.entrada}`, { size: 9, color: [110, 110, 110] });
    if (p.saida) line(`Saída: ${p.saida}`, { size: 9, color: [110, 110, 110] });
    if (p.pontoControle) line(`Ponto de controle: ${p.pontoControle}`, { size: 9, color: [110, 110, 110] });

    if (p.imagemUrl) {
      const img = await fetchImageDataUrl(p.imagemUrl);
      if (img) {
        const drawW = Math.min(contentW, 90);
        const drawH = (img.h / img.w) * drawW;
        ensureSpace(drawH + 3);
        try {
          pdf.addImage(img.data, 'PNG', margin, y, drawW, drawH);
          y += drawH + 3;
        } catch {
          // imagem inválida — ignora, mantém o texto
        }
      }
    }
  }

  if (content.indicadores?.length) {
    section('Indicadores');
    content.indicadores.forEach((i) => line(`• ${i}`, { color: [50, 50, 50] }));
  }
  if (content.riscos?.length) {
    section('Riscos e cuidados');
    content.riscos.forEach((r) => line(`• ${r}`, { color: [50, 50, 50] }));
  }

  // Rodapé
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Bravy BPMN · AILA  —  página ${p} de ${pages}`, margin, pageH - 8);
  }

  const safeTitle = (content.titulo || 'pop').replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  pdf.save(`${safeTitle}.pdf`);
}
