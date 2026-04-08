'use client';

import { useState, FormEvent } from 'react';
import { Workflow } from 'lucide-react';
import { credentialsMatch } from '@/lib/internal-auth';

type LoginScreenProps = {
  onSuccess: () => void;
};

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(false);
    if (credentialsMatch(user.trim(), pass)) {
      onSuccess();
      return;
    }
    setError(true);
    setPass('');
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] border border-zinc-200 bg-white rounded-bpmn p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 bg-zinc-900 rounded-bpmn flex items-center justify-center shadow-sm mb-4">
            <Workflow size={22} className="text-white" />
          </div>
          <h1 className="font-bold text-lg text-zinc-900 tracking-tight">Bravy BPMN</h1>
          <p className="text-xs text-zinc-500 mt-1 text-center">Acesso restrito — uso interno</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-user" className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Usuário
            </label>
            <input
              id="login-user"
              name="username"
              type="text"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label htmlFor="login-pass" className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Senha
            </label>
            <input
              id="login-pass"
              name="password"
              type="password"
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-600 font-medium" role="alert">
              Usuário ou senha incorretos.
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
