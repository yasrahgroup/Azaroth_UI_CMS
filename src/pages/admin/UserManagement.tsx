import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { User, UserRole } from '../../types';

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'admin', label: 'Administrator', description: 'Full CMS and team access' },
  { value: 'editor', label: 'Editor', description: 'Content, products, and publishing' },
  { value: 'viewer', label: 'Viewer', description: 'Dashboard and profile only' },
];

const roleBadgeClass: Record<UserRole, string> = {
  admin: 'bg-[#35123F]/10 text-[#35123F] border-[#35123F]/30',
  editor: 'bg-[#D5A13C]/15 text-[#8A6417] border-[#D5A13C]/40',
  viewer: 'bg-slate-100 text-slate-600 border-slate-300',
};

interface CreateFormState {
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

const emptyCreateForm: CreateFormState = {
  name: '',
  email: '',
  role: 'editor',
  password: '',
};

export const UserManagement: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const { cmsMode } = useTheme();
  const isLight = cmsMode === 'light';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm);
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'viewer' as UserRole });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', { headers: authHeaders });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || 'Unable to load team accounts.');
        return;
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('Network error while loading team accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(createForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Unable to create this team member.');
        return;
      }
      setCreateForm(emptyCreateForm);
      showFeedback(`Account created for ${data.user?.name || createForm.name}.`);
      await loadUsers();
    } catch {
      setError('Network error while creating the account.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditError(null);
  };

  const handleSaveEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(data.error || 'Unable to update this account.');
        return;
      }
      setEditingUser(null);
      showFeedback(`${data.user?.name || editForm.name}'s account was updated.`);
      await loadUsers();
    } catch {
      setEditError('Network error while updating the account.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (target: User) => {
    if (!window.confirm(`Delete ${target.name}'s account? This cannot be undone.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/users/${target.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Unable to delete this account.');
        return;
      }
      showFeedback(`${target.name}'s account was deleted.`);
      await loadUsers();
    } catch {
      setError('Network error while deleting the account.');
    }
  };

  const openPasswordReset = (target: User) => {
    setPasswordTarget(target);
    setResetPassword('');
    setPasswordError(null);
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passwordTarget) return;
    setSavingPassword(true);
    setPasswordError(null);
    try {
      const res = await fetch(`/api/users/${passwordTarget.id}/password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordError(data.error || 'Unable to reset this password.');
        return;
      }
      setPasswordTarget(null);
      showFeedback(`Password reset for ${passwordTarget.name}.`);
    } catch {
      setPasswordError('Network error while resetting the password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const cardClass = `rounded-2xl border shadow-xs ${
    isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
  }`;
  const inputClass = `w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#35123F] ${
    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0D101D] border-slate-700 text-white'
  }`;
  const labelClass = `block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`;

  const counts = {
    total: users.length,
    admins: users.filter((entry) => entry.role === 'admin').length,
    editors: users.filter((entry) => entry.role === 'editor').length,
    viewers: users.filter((entry) => entry.role === 'viewer').length,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className={`border-b pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Team & Access Control
          </h2>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Create staff accounts and assign role-based permissions across the CMS.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D5A13C]">
          <ShieldCheck className="w-4 h-4" />
          Administrator only
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {feedback && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Accounts', value: counts.total, icon: Users },
          { label: 'Administrators', value: counts.admins, icon: ShieldCheck },
          { label: 'Editors', value: counts.editors, icon: Pencil },
          { label: 'Viewers', value: counts.viewers, icon: UserIcon },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${cardClass} p-4 flex items-center gap-3`}>
              <div className="w-9 h-9 rounded-lg bg-[#35123F]/10 text-[#35123F] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-lg font-bold leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {stat.value}
                </p>
                <p className={`text-[10px] uppercase tracking-wider mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${cardClass} p-5 sm:p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-4 h-4 text-[#35123F]" />
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Create Team Account
          </h3>
        </div>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end">
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Role</label>
            <select
              value={createForm.role}
              onChange={(event) =>
                setCreateForm({ ...createForm, role: event.target.value as UserRole })
              }
              className={inputClass}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Temporary Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={createForm.password}
              onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="h-10 inline-flex items-center justify-center gap-2 px-4 rounded-lg bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {creating ? 'Creating...' : 'Add Member'}
          </button>
        </form>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className={`px-5 py-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Team Accounts
          </h3>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading team accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No team accounts found.</div>
        ) : (
          <div className="divide-y divide-slate-200/60">
            {users.map((entry) => {
              const isSelf = entry.id === currentUser?.id;
              return (
                <div key={entry.id} className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#171B2C] border border-[#D5A13C]/40 flex items-center justify-center text-sm font-bold text-[#D5A13C] shrink-0">
                      {entry.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {entry.name} {isSelf && <span className="text-[10px] text-[#35123F]">(You)</span>}
                      </p>
                      <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {entry.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${roleBadgeClass[entry.role]}`}>
                      {ROLE_OPTIONS.find((option) => option.value === entry.role)?.label || entry.role}
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Added {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(entry)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                      title="Edit account"
                      aria-label={`Edit ${entry.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openPasswordReset(entry)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                      title="Reset password"
                      aria-label={`Reset password for ${entry.name}`}
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      disabled={isSelf}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title={isSelf ? 'You cannot delete your own account' : 'Delete account'}
                      aria-label={`Delete ${entry.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Edit {editingUser.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close edit dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm({ ...editForm, role: event.target.value as UserRole })
                  }
                  className={inputClass}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} — {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl ${isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'}`}>
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                aria-label="Close password dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePasswordReset} className="p-5 space-y-4">
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Set a new temporary password for <strong>{passwordTarget.name}</strong> ({passwordTarget.email}).
              </p>
              {passwordError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  {savingPassword ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
