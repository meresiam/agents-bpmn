'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth.context';
import { AilaLogo } from '@/components/brand/AilaLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

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
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <AilaLogo size={44} wordmarkSuffix="BPMN" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-surface-elevated border border-border-app rounded-aila p-6 shadow-sm"
        >
          <h1 className="font-display text-2xl font-semibold text-fg-primary mb-1 tracking-tight">
            Entrar
          </h1>
          <p className="text-sm text-fg-secondary mb-6">
            Acesse seus fluxogramas de processo.
          </p>

          {error && (
            <div className="mb-4 px-3 py-2 bg-aila-error/10 border border-aila-error/30 rounded-aila text-sm text-aila-error">
              {error}
            </div>
          )}

          <label htmlFor="email" className="block text-sm font-medium text-fg-primary mb-1.5">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2.5 text-sm border border-border-app rounded-aila bg-surface-elevated text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/30 focus:border-aila-violet/40 mb-4"
            placeholder="voce@empresa.com.br"
          />

          <label htmlFor="password" className="block text-sm font-medium text-fg-primary mb-1.5">
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
            className="w-full px-3 py-2.5 text-sm border border-border-app rounded-aila bg-surface-elevated text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/30 focus:border-aila-violet/40 mb-6"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black text-sm font-semibold rounded-aila hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-fg-tertiary mt-6">
          Sua empresa, AI Driven.
        </p>
      </div>
    </div>
  );
}
