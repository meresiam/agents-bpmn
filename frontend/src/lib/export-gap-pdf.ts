import type { Gap, GapAnalysisResult } from '@/services/chat.service';

const TIPO_LABEL: Record<Gap['tipo'], string> = {
  GARGALO: 'Gargalo',
  RETRABALHO: 'Retrabalho',
  ETAPA_MANUAL: 'Etapa manual',
  FALTA_DE_DADO: 'Falta de dado',
  RISCO_COMPLIANCE: 'Risco / compliance',
  ESPERA: 'Espera',
  OUTRO: 'Outro',
};

const ABORDAGEM_LABEL: Record<Gap['solucao']['abordagem'], string> = {
  IA: 'IA',
  AUTOMACAO: 'Automação',
  PROCESSO: 'Processo',
  PESSOAS: 'Pessoas',
};

/**
 * Gera um PDF textual do relatório de análise de GAP (Epic 4.B.4).
 * Usa jsPDF direto (já é dependência) — relatório de texto, não screenshot do diagrama.
 */
export async function exportGapReportPdf(result: GapAnalysisResult): Promise<void> {
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

  // Cabeçalho
  line('Análise de GAP — AILA', { size: 18, bold: true, color: [88, 80, 236] });
  y += 1;
  line(result.mode === 'pair' ? `${result.asIsTitle}  ·  ${result.toBeTitle ?? 'TO-BE'}` : result.asIsTitle, {
    size: 11,
    color: [90, 90, 90],
  });
  y += 2;

  // Resumo
  line('Resumo', { size: 12, bold: true });
  line(result.resumo, { size: 10, color: [50, 50, 50] });
  y += 3;

  // Gaps
  line(`Gaps identificados (${result.gaps.length})`, { size: 12, bold: true });
  y += 1;

  result.gaps.forEach((g, i) => {
    ensureSpace(40);
    y += 2;
    // separador
    pdf.setDrawColor(225, 225, 225);
    pdf.line(margin, y, pageW - margin, y);
    y += 5;

    line(`${i + 1}. ${g.titulo}`, { size: 11, bold: true });
    line(
      `${TIPO_LABEL[g.tipo]}  ·  Severidade ${g.severidade}  ·  ${
        g.solucao.precisaIA ? 'Precisa de IA' : 'Não precisa de IA'
      } (${ABORDAGEM_LABEL[g.solucao.abordagem]})`,
      { size: 9, color: [110, 110, 110] },
    );
    if (g.localizacao) line(`Onde: ${g.localizacao}`, { size: 9, color: [110, 110, 110] });
    line(`Recomendação: ${g.recomendacao}`, { size: 10, color: [40, 40, 40] });
    if (g.solucao.descricao) line(`Solução: ${g.solucao.descricao}`, { size: 10, color: [40, 40, 40] });
  });

  // Rodapé
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Bravy BPMN · AILA  —  página ${p} de ${pages}`, margin, pageH - 8);
  }

  const safeTitle = result.asIsTitle.replace(/\s+/g, '-').toLowerCase().slice(0, 40);
  pdf.save(`gap-analysis-${safeTitle}.pdf`);
}
