'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Code2, LogOut, Workflow } from 'lucide-react';
import { EXAMPLE_PROCESSES } from '@/data/examples';
import { useAuth } from '@/components/AuthShell';

const ProcessGraphEditor = dynamic(() => import('@/components/ProcessGraphEditor'), { ssr: false });

export default function HomePage() {
  const { logout } = useAuth();
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/90 backdrop-blur-sm border-b border-zinc-200">
          <button
            type="button"
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
      <header className="border-b border-zinc-200 bg-white/85 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-zinc-900 rounded-bpmn flex items-center justify-center shadow-sm shrink-0">
              <Workflow size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-zinc-900 tracking-tight truncate">Bravy BPMN</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowEditor(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
            >
              <Code2 size={16} />
              Abrir Editor
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2.5 border border-zinc-200 bg-white text-zinc-700 text-sm font-semibold rounded-bpmn hover:bg-zinc-50 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 pb-20">
        <h1 className="text-xl font-bold text-zinc-900 tracking-tight mb-1">Processos</h1>
        <p className="text-sm text-zinc-500 mb-8">Selecione um processo ou abra o editor JSON.</p>
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
              <h2 className="font-semibold text-zinc-900 mb-1 tracking-tight">{proc.title}</h2>
              <p className="text-xs text-zinc-500 leading-relaxed">{proc.description}</p>
              {proc.updatedAt && (
                <p className="text-[10px] text-zinc-400 mt-3 font-medium">Atualizado em {proc.updatedAt}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
