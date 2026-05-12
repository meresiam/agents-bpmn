'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import {
  AdminRole,
  AdminTenant,
  AdminUser,
  createUser,
  deleteUser,
  listTenants,
  listUsers,
  resetUserPassword,
  updateUser,
} from '@/services/admin.service';
import { ModalShell } from '@/components/admin/ModalShell';
import { cn } from '@/lib/utils';

type Mode =
  | { kind: 'idle' }
  | { kind: 'create' }
  | { kind: 'edit'; user: AdminUser }
  | { kind: 'password'; user: AdminUser }
  | { kind: 'delete'; user: AdminUser };

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  CLIENT: 'Cliente',
};

const ROLE_BADGE: Record<AdminRole, string> = {
  SUPER_ADMIN: 'bg-aila-violet/15 text-aila-violet border-aila-violet/30',
  ADMIN: 'bg-aila-cyan/15 text-aila-cyan border-aila-cyan/30',
  CLIENT: 'bg-fg-tertiary/10 text-fg-secondary border-border-app',
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTenant, setFilterTenant] = useState<string>('');
  const [filterRole, setFilterRole] = useState<AdminRole | ''>('');
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, t] = await Promise.all([listUsers(), listTenants()]);
      setUsers(u);
      setTenants(t);
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
    return users.filter((u) => {
      if (filterTenant && u.tenantId !== filterTenant) return false;
      if (filterRole && u.role !== filterRole) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.tenantId.toLowerCase().includes(q)
      );
    });
  }, [users, search, filterTenant, filterRole]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-fg-primary tracking-tight">
            Usuários
          </h1>
          <p className="text-xs text-fg-tertiary mt-0.5">
            {users.length} {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode({ kind: 'create' })}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black rounded-aila hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Novo usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-tertiary pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cliente…"
            className="w-full pl-8 pr-2 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
          />
        </div>
        <select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
          className="px-2 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
        >
          <option value="">Todos os clientes</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.slug}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as AdminRole | '')}
          className="px-2 py-2 text-sm bg-surface-elevated border border-border-app rounded-aila text-fg-primary focus:outline-none focus:ring-1 focus:ring-aila-violet/40"
        >
          <option value="">Todos os papéis</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="CLIENT">Cliente</option>
        </select>
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
          {users.length === 0 ? 'Sem usuários ainda.' : 'Nada bate com os filtros.'}
        </p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                isSelf={u.id === currentUser?.id}
                onEdit={() => setMode({ kind: 'edit', user: u })}
                onResetPassword={() => setMode({ kind: 'password', user: u })}
                onDelete={() => setMode({ kind: 'delete', user: u })}
              />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-surface-elevated border border-border-app rounded-aila overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-[11px] uppercase tracking-wider text-fg-tertiary">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Nome</th>
                  <th className="px-3 py-2 text-left font-semibold">E-mail</th>
                  <th className="px-3 py-2 text-left font-semibold">Cliente</th>
                  <th className="px-3 py-2 text-left font-semibold">Papel</th>
                  <th className="px-3 py-2 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border-app hover:bg-surface-hover/40"
                  >
                    <td className="px-3 py-2 text-fg-primary font-medium">
                      {u.name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider text-fg-tertiary">
                          (você)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-fg-secondary">{u.email}</td>
                    <td className="px-3 py-2 text-fg-secondary">{u.tenantId}</td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded',
                          ROLE_BADGE[u.role],
                        )}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <IconBtn
                          title="Editar"
                          onClick={() => setMode({ kind: 'edit', user: u })}
                        >
                          <Pencil size={13} />
                        </IconBtn>
                        <IconBtn
                          title="Resetar senha"
                          onClick={() => setMode({ kind: 'password', user: u })}
                        >
                          <KeyRound size={13} />
                        </IconBtn>
                        <IconBtn
                          title="Excluir"
                          disabled={u.id === currentUser?.id}
                          onClick={() => setMode({ kind: 'delete', user: u })}
                        >
                          <Trash2 size={13} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mode.kind === 'create' && (
        <UserFormModal
          tenants={tenants}
          onClose={() => setMode({ kind: 'idle' })}
          onSubmit={async (data) => {
            await createUser(data);
            setMode({ kind: 'idle' });
            await reload();
          }}
        />
      )}
      {mode.kind === 'edit' && (
        <UserFormModal
          tenants={tenants}
          editing={mode.user}
          isSelf={mode.user.id === currentUser?.id}
          onClose={() => setMode({ kind: 'idle' })}
          onSubmit={async (data) => {
            await updateUser(mode.user.id, {
              name: data.name,
              tenantId: data.tenantId,
              role: data.role,
            });
            setMode({ kind: 'idle' });
            await reload();
          }}
        />
      )}
      {mode.kind === 'password' && (
        <PasswordModal
          user={mode.user}
          onClose={() => setMode({ kind: 'idle' })}
          onSubmit={async (pwd) => {
            await resetUserPassword(mode.user.id, pwd);
            setMode({ kind: 'idle' });
          }}
        />
      )}
      {mode.kind === 'delete' && (
        <ConfirmModal
          title="Excluir usuário"
          message={`Tem certeza que quer excluir ${mode.user.name} (${mode.user.email})? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          danger
          onClose={() => setMode({ kind: 'idle' })}
          onConfirm={async () => {
            await deleteUser(mode.user.id);
            setMode({ kind: 'idle' });
            await reload();
          }}
        />
      )}
    </div>
  );
}

// ------- Componentes locais -------

function IconBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'p-1.5 text-fg-tertiary hover:text-fg-primary hover:bg-surface-hover rounded-aila transition-colors',
        disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-fg-tertiary',
      )}
    >
      {children}
    </button>
  );
}

function UserCard({
  user,
  isSelf,
  onEdit,
  onResetPassword,
  onDelete,
}: {
  user: AdminUser;
  isSelf: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-surface-elevated border border-border-app rounded-aila p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-fg-primary truncate">
            {user.name}
            {isSelf && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-fg-tertiary">
                (você)
              </span>
            )}
          </p>
          <p className="text-xs text-fg-secondary truncate">{user.email}</p>
        </div>
        <span
          className={cn(
            'shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded',
            ROLE_BADGE[user.role],
          )}
        >
          {ROLE_LABEL[user.role]}
        </span>
      </div>
      <p className="text-[11px] text-fg-tertiary mt-1">Cliente: {user.tenantId}</p>
      <div className="flex gap-1 mt-3 pt-2 border-t border-border-app">
        <IconBtn title="Editar" onClick={onEdit}>
          <Pencil size={13} />
        </IconBtn>
        <IconBtn title="Resetar senha" onClick={onResetPassword}>
          <KeyRound size={13} />
        </IconBtn>
        <IconBtn title="Excluir" disabled={isSelf} onClick={onDelete}>
          <Trash2 size={13} />
        </IconBtn>
      </div>
    </div>
  );
}

interface UserFormModalProps {
  tenants: AdminTenant[];
  editing?: AdminUser;
  isSelf?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    email: string;
    name: string;
    password: string;
    tenantId: string;
    role: AdminRole;
  }) => Promise<void>;
}

function UserFormModal({
  tenants,
  editing,
  isSelf,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [name, setName] = useState(editing?.name ?? '');
  const [email, setEmail] = useState(editing?.email ?? '');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(editing?.tenantId ?? tenants[0]?.slug ?? '');
  const [role, setRole] = useState<AdminRole>(editing?.role ?? 'CLIENT');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <ModalShell
      title={editing ? 'Editar usuário' : 'Novo usuário'}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setSubmitting(true);
          try {
            await onSubmit({ name, email, password, tenantId, role });
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : 'Erro ao salvar');
          } finally {
            setSubmitting(false);
          }
        }}
        className="space-y-3"
      >
        {tenants.length === 0 && (
          <div className="px-3 py-2 bg-aila-error/10 border border-aila-error/30 rounded-aila text-xs text-aila-error">
            Cadastre um cliente em "Clientes" antes de criar usuário.
          </div>
        )}

        <Field label="Nome">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            className={inputClass}
          />
        </Field>
        <Field label="E-mail">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={!!editing}
            autoComplete="off"
            className={cn(inputClass, editing && 'opacity-60')}
          />
          {editing && (
            <p className="text-[10px] text-fg-tertiary mt-1">
              E-mail não pode ser alterado.
            </p>
          )}
        </Field>
        {!editing && (
          <Field label="Senha inicial">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Mínimo 6 caracteres"
            />
            <p className="text-[10px] text-fg-tertiary mt-1">
              Envie a senha manualmente pro usuário. Ele pode mudar depois.
            </p>
          </Field>
        )}
        <Field label="Cliente">
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            required
            className={inputClass}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Papel">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            disabled={isSelf}
            className={cn(inputClass, isSelf && 'opacity-60')}
          >
            <option value="CLIENT">Cliente (visualizador)</option>
            <option value="ADMIN">Admin do tenant</option>
            <option value="SUPER_ADMIN">Super Admin (vê tudo)</option>
          </select>
          {isSelf && (
            <p className="text-[10px] text-fg-tertiary mt-1">
              Você não pode alterar o próprio papel.
            </p>
          )}
        </Field>

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
            disabled={submitting || tenants.length === 0}
            className="px-4 py-2 text-xs font-semibold bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black rounded-aila hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Salvando…' : editing ? 'Salvar' : 'Criar usuário'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function PasswordModal({
  user,
  onClose,
  onSubmit,
}: {
  user: AdminUser;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <ModalShell title="Resetar senha" onClose={onClose}>
      <p className="text-sm text-fg-secondary mb-3">
        Definindo nova senha para <strong className="text-fg-primary">{user.name}</strong> ({user.email}).
      </p>
      {ok ? (
        <div className="space-y-3">
          <div className="px-3 py-2 bg-aila-violet/10 border border-aila-violet/30 rounded-aila text-sm text-fg-primary">
            Senha atualizada. Envie pro usuário:
          </div>
          <code className="block px-3 py-2 bg-surface border border-border-app rounded-aila text-sm font-mono text-fg-primary select-all">
            {pwd}
          </code>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black rounded-aila"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            if (pwd !== confirm) {
              setErr('As senhas não conferem.');
              return;
            }
            setSubmitting(true);
            try {
              await onSubmit(pwd);
              setOk(true);
            } catch (e2) {
              setErr(e2 instanceof Error ? e2.message : 'Erro ao salvar');
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <Field label="Nova senha">
            <input
              type="text"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
          <Field label="Confirmar">
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
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
              {submitting ? 'Salvando…' : 'Salvar nova senha'}
            </button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-sm text-fg-secondary mb-4">{message}</p>
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
          disabled={submitting}
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
          className={cn(
            'px-4 py-2 text-xs font-semibold rounded-aila hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
            danger
              ? 'bg-aila-error text-white'
              : 'bg-aila-black dark:bg-aila-cream text-aila-cream dark:text-aila-black',
          )}
        >
          {submitting ? 'Aguarde…' : confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

// ------- Reutilizáveis -------

const inputClass =
  'w-full px-2.5 py-2 text-sm bg-surface border border-border-app rounded-aila text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-1 focus:ring-aila-violet/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-fg-tertiary mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

