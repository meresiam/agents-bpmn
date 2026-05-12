'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  AdminTenant,
  createTenant,
  deleteTenant,
  listTenants,
  updateTenant,
} from '@/services/admin.service';
import { ModalShell } from '@/components/admin/ModalShell';
import { cn } from '@/lib/utils';

type Mode =
  | { kind: 'idle' }
  | { kind: 'create' }
  | { kind: 'edit'; tenant: AdminTenant }
  | { kind: 'delete'; tenant: AdminTenant };

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTenants(await listTenants());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter(
      (t) =>
        t.slug.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  }, [tenants, search]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg-primary tracking-tight">
            Clientes
          </h1>
          <p className="text-xs text-fg-tertiary mt-0.5">
            {tenants.length} {tenants.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode({ kind: 'create' })}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black rounded-aila hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Novo cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por slug ou nome…"
          className="w-full pl-8 pr-2 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
        />
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-aila-error/10 border border-aila-error/30 rounded-aila text-sm text-aila-error">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-fg-tertiary py-8 text-center">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-fg-tertiary py-8 text-center">
          {tenants.length === 0 ? 'Sem clientes ainda.' : 'Nada bate com a busca.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-surface-elevated border border-border-app rounded-aila p-3 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-fg-primary truncate">{t.name}</p>
                  <p className="text-[11px] text-fg-tertiary font-mono mt-0.5">
                    {t.slug}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    title="Renomear"
                    aria-label="Renomear"
                    onClick={() => setMode({ kind: 'edit', tenant: t })}
                    className="p-1.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    title="Excluir"
                    aria-label="Excluir"
                    disabled={t.userCount > 0 || t.processCount > 0}
                    onClick={() => setMode({ kind: 'delete', tenant: t })}
                    className={cn(
                      'p-1.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors',
                      (t.userCount > 0 || t.processCount > 0) &&
                        'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-fg-tertiary',
                    )}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div className="flex gap-3 text-[11px] text-fg-secondary pt-2 border-t border-border-app">
                <span>
                  <strong className="text-fg-primary">{t.userCount}</strong> usuários
                </span>
                <span>
                  <strong className="text-fg-primary">{t.processCount}</strong> fluxos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode.kind === 'create' && (
        <TenantFormModal
          onClose={() => setMode({ kind: 'idle' })}
          onSubmit={async (data) => {
            await createTenant(data);
            setMode({ kind: 'idle' });
            await reload();
          }}
        />
      )}
      {mode.kind === 'edit' && (
        <TenantFormModal
          editing={mode.tenant}
          onClose={() => setMode({ kind: 'idle' })}
          onSubmit={async (data) => {
            await updateTenant(mode.tenant.id, { name: data.name });
            setMode({ kind: 'idle' });
            await reload();
          }}
        />
      )}
      {mode.kind === 'delete' && (
        <DeleteConfirm
          tenant={mode.tenant}
          onClose={() => setMode({ kind: 'idle' })}
          onConfirm={async () => {
            await deleteTenant(mode.tenant.id);
            setMode({ kind: 'idle' });
            await reload();
          }}
        />
      )}
    </div>
  );
}

function TenantFormModal({
  editing,
  onClose,
  onSubmit,
}: {
  editing?: AdminTenant;
  onClose: () => void;
  onSubmit: (data: { slug: string; name: string }) => Promise<void>;
}) {
  const [slug, setSlug] = useState(editing?.slug ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <ModalShell
      title={editing ? 'Renomear cliente' : 'Novo cliente'}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setSubmitting(true);
          try {
            await onSubmit({ slug, name });
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : 'Erro');
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-3"
      >
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-fg-tertiary mb-1">
            Slug (identificador técnico)
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            required
            disabled={!!editing}
            pattern="^[a-z0-9][a-z0-9-]*$"
            title="Letras minúsculas, números e hifens"
            placeholder="ex: dkw, oh-a-agua"
            className="w-full px-2.5 py-2 text-sm bg-surface border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40 font-mono disabled:opacity-60"
          />
          <p className="text-[10px] text-fg-tertiary mt-1">
            {editing
              ? 'Slug não pode ser alterado (é usado em users/processes).'
              : 'Apenas letras minúsculas, números e hifens. Não muda depois.'}
          </p>
        </label>
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-fg-tertiary mb-1">
            Nome de exibição
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={1}
            placeholder="ex: DKW Imóveis"
            className="w-full px-2.5 py-2 text-sm bg-surface border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
          />
        </label>
        {err && (
          <div className="px-3 py-2 bg-aila-error/10 border border-aila-error/30 rounded-aila text-xs text-aila-error">
            {err}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-medium text-fg-secondary hover:text-fg-primary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black rounded-aila hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Salvando…' : editing ? 'Salvar' : 'Criar cliente'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function DeleteConfirm({
  tenant,
  onClose,
  onConfirm,
}: {
  tenant: AdminTenant;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <ModalShell title="Excluir cliente" onClose={onClose}>
      <p className="text-sm text-fg-secondary mb-4">
        Excluir <strong className="text-fg-primary">{tenant.name}</strong> ({tenant.slug})?
        {tenant.userCount === 0 && tenant.processCount === 0
          ? ' O cliente não tem usuários nem fluxos vinculados.'
          : ` Bloqueado: ${tenant.userCount} usuário(s) e ${tenant.processCount} fluxo(s) ainda vinculados.`}
      </p>
      {err && (
        <div className="mb-3 px-3 py-2 bg-aila-error/10 border border-aila-error/30 rounded-aila text-xs text-aila-error">
          {err}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 text-xs font-medium text-fg-secondary hover:text-fg-primary"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={submitting || tenant.userCount > 0 || tenant.processCount > 0}
          onClick={async () => {
            setErr(null);
            setSubmitting(true);
            try {
              await onConfirm();
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Erro');
            } finally {
              setSubmitting(false);
            }
          }}
          className="px-4 py-2 text-xs font-semibold bg-aila-error text-white rounded-aila hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Excluindo…' : 'Excluir'}
        </button>
      </div>
    </ModalShell>
  );
}
