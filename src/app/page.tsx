'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  Code2,
  Workflow,
  Zap,
  Share2,
  Download,
} from 'lucide-react';
import { EXAMPLE_PROCESSES } from '@/data/examples';

const ProcessGraphEditor = dynamic(() => import('@/components/ProcessGraphEditor'), { ssr: false });

export default function HomePage() {
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-zinc-200">
          <button
            onClick={() => setShowEditor(false)}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900"
          >
            ← Voltar
          </button>
        </div>
        <div style={{ flex: 1 }}>
          <ProcessGraphEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 rounded-bpmn flex items-center justify-center shadow-sm">
              <Workflow size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-zinc-900 tracking-tight">Bravy BPMN</span>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Code2 size={16} />
            Abrir Editor
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 rounded-full text-xs font-semibold text-zinc-500 mb-6 shadow-sm">
            Ferramenta interna Bravy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 leading-[1.15] mb-4 tracking-tight">
            Visualizador de processos BPMN
          </h1>
          <p className="text-lg text-zinc-500 mb-8 leading-relaxed max-w-2xl mx-auto">
            Defina o processo em JSON (Bravy Graph) e visualize em BPMN 2.0 interativo.
            Notação formal, layout automático, exportação PNG/PDF.
          </p>
          <button
            onClick={() => setShowEditor(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-md"
          >
            Começar agora
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Zap size={20} />, title: 'JSON → BPMN', desc: 'Descreva nodes e edges em JSON e veja o fluxograma com layout automático.' },
            { icon: <Workflow size={20} />, title: 'Notação BPMN 2.0', desc: 'Start/End Event, User/Service/Manual Task, Exclusive/Parallel/Inclusive Gateway, pool e fases no JSON.' },
            { icon: <Share2 size={20} />, title: 'URL Compartilhável', desc: 'Cada processo tem uma URL única para enviar ao cliente.' },
            { icon: <Download size={20} />, title: 'Exportar PNG/PDF', desc: 'Exporte para apresentações e documentos com qualidade profissional.' },
            { icon: <Code2 size={20} />, title: 'Editor Integrado', desc: 'Editor JSON com validação, preview em tempo real e split view.' },
            { icon: <ArrowRight size={20} />, title: 'Interativo', desc: 'Zoom, drag, minimap. Explore o fluxograma livremente.' },
          ].map((feat, i) => (
            <div
              key={i}
              className="border border-zinc-200 bg-white rounded-bpmn p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-10 h-10 rounded-bpmn bg-zinc-100 border border-zinc-100 flex items-center justify-center mb-4 text-zinc-500">
                {feat.icon}
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2 tracking-tight">{feat.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Processes */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6 tracking-tight">Processos cadastrados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXAMPLE_PROCESSES.map((proc) => (
            <Link
              key={proc.id}
              href={`/bpmn/${proc.client}/${proc.process}`}
              className="group block border border-zinc-200 bg-white rounded-bpmn p-5 hover:shadow-md hover:border-zinc-300 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">{proc.client}</span>
                <ArrowRight size={14} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-zinc-900 mb-1 tracking-tight">{proc.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{proc.description}</p>
              {proc.updatedAt && (
                <p className="text-[10px] text-zinc-400 mt-3 font-medium">Atualizado em {proc.updatedAt}</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-zinc-400 font-medium">
          <span>Bravy BPMN — Ferramenta interna</span>
          <span>v0.1.0</span>
        </div>
      </footer>
    </div>
  );
}
