/**
 * Tema de raias (swimlanes) — cor + ícone de papel por raia.
 *
 * Fonte única de verdade pro visual colorido do diagrama. Paleta NEUTRA e
 * profissional (não a paleta de marca AILA — diagramas são entrega de cliente).
 * A cor é resolvida pelo ÍNDICE da raia (sequencial, determinístico, distinto
 * entre raias adjacentes). O ícone é inferido pelo NOME da raia (papel).
 */

export interface LaneAccent {
  /** Hex saturado — borda de nó, ícone, traço do losango, texto do rótulo da raia. */
  stroke: string;
  /** Fundo bem leve da faixa da raia (rgba de baixa opacidade). */
  tint: string;
  /** Fundo da célula da coluna de rótulo da raia (um pouco mais forte). */
  labelBg: string;
}

interface PaletteEntry {
  stroke: string;
  rgb: string; // "r,g,b" pra montar rgba de tint/labelBg
}

/** 8 matizes distintos, ciclados por índice de raia. */
const PALETTE: PaletteEntry[] = [
  { stroke: '#059669', rgb: '5,150,105' }, // emerald
  { stroke: '#2563eb', rgb: '37,99,235' }, // blue
  { stroke: '#d97706', rgb: '217,119,6' }, // amber
  { stroke: '#7c3aed', rgb: '124,58,237' }, // violet
  { stroke: '#0d9488', rgb: '13,148,136' }, // teal
  { stroke: '#e11d48', rgb: '225,29,72' }, // rose
  { stroke: '#4f46e5', rgb: '79,70,229' }, // indigo
  { stroke: '#ea580c', rgb: '234,88,12' }, // orange
];

export function laneAccent(index: number): LaneAccent {
  const p = PALETTE[((index % PALETTE.length) + PALETTE.length) % PALETTE.length];
  return {
    stroke: p.stroke,
    tint: `rgba(${p.rgb},0.05)`,
    labelBg: `rgba(${p.rgb},0.11)`,
  };
}

// ─── Ícone de papel (inferido do nome da raia) ──────────────────────────────

export type LaneIconKey =
  | 'user'
  | 'users'
  | 'cart'
  | 'calculator'
  | 'dollar'
  | 'fileSearch'
  | 'scale'
  | 'truck'
  | 'package'
  | 'factory'
  | 'megaphone'
  | 'briefcase'
  | 'headset'
  | 'monitor'
  | 'cog'
  | 'stethoscope'
  | 'landmark'
  | 'building';

/** Regras de palavra-chave → ícone. Primeira correspondência vence. */
const ICON_RULES: { icon: LaneIconKey; terms: string[] }[] = [
  { icon: 'cart', terms: ['supriment', 'compra', 'procurement', 'almoxarif', 'aquisi'] },
  { icon: 'calculator', terms: ['contabil', 'contábil', 'contador', 'contadora'] },
  { icon: 'dollar', terms: ['financ', 'faturament', 'cobranç', 'cobranc', 'tesourar', 'pagament', 'caixa'] },
  { icon: 'scale', terms: ['fiscal', 'tributár', 'tributar', 'jurídic', 'juridic', 'legal', 'compliance', 'auditor'] },
  { icon: 'truck', terms: ['fornecedor', 'logístic', 'logistic', 'entrega', 'transport', 'expedi'] },
  { icon: 'package', terms: ['estoque', 'inventár', 'inventar', 'armazém', 'armazem', 'depósito', 'deposito'] },
  { icon: 'factory', terms: ['produç', 'produc', 'fábric', 'fabric', 'operaç', 'operac', 'manufat'] },
  { icon: 'megaphone', terms: ['marketing', 'tráfego', 'trafego', 'mídia', 'midia', 'social', 'publicid', 'campanh'] },
  { icon: 'briefcase', terms: ['comercial', 'vendas', 'venda', 'sdr', 'negóci', 'negoci', 'sales'] },
  { icon: 'headset', terms: ['suporte', 'atendiment', 'sac', 'customer', 'helpdesk', 'cs'] },
  { icon: 'monitor', terms: ['tecnolog', 'sistema', 'desenvolv', 'dev', ' ti', 'ti ', 'infra', 'software'] },
  { icon: 'stethoscope', terms: ['saúde', 'saude', 'clínic', 'clinic', 'médic', 'medic', 'enfermag', 'paciente'] },
  { icon: 'users', terms: ['rh', 'recursos humanos', 'pessoas', 'people', 'equipe', 'time', 'gestão de pessoas'] },
  { icon: 'cog', terms: ['process', 'qualidade', 'pmo', 'projeto'] },
  { icon: 'landmark', terms: ['banc', 'governo', 'órgão', 'orgao', 'pública', 'publica', 'cartóri', 'cartori'] },
  { icon: 'user', terms: ['demandant', 'solicitant', 'requisit', 'cliente', 'usuári', 'usuari', 'colaborad', 'gestor', 'diretor', 'gerent', 'analista', 'lead'] },
];

export function laneIconKey(laneName: string): LaneIconKey {
  const n = ` ${laneName.toLowerCase().trim()} `;
  for (const rule of ICON_RULES) {
    if (rule.terms.some((t) => n.includes(t))) return rule.icon;
  }
  return 'building';
}
