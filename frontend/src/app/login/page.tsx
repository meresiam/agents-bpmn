'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Workflow } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-zinc-900 rounded-bpmn flex items-center justify-center shadow-sm">
            <Workflow size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-900 tracking-tight">Bravy BPMN</span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-zinc-200 rounded-bpmn p-6 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-zinc-900 mb-1">Entrar</h1>
          <p className="text-sm text-zinc-500 mb-6">Acesse seus fluxogramas de processo.</p>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-bpmn text-sm text-red-700">
              {error}
            </div>
          )}

          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1.5">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 mb-4"
            placeholder="voce@empresa.com.br"
          />

          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1.5">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={6}
            className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 mb-6"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
