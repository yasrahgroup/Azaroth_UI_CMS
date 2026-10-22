import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleOff, LoaderCircle, Puzzle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AddonItem {
  id: string;
  name: string;
  description: string;
  version: string;
  kind: 'core' | 'website';
  dependencies: string[];
  permissions: string[];
  routes: string[];
  apiRoutes: string[];
  contentTypes: string[];
  compatibility: string;
  migrationVersion: number;
  disableable: boolean;
  enabled: boolean;
}

export const AddonManager: React.FC = () => {
  const { token } = useAuth();
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/addons', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not load the approved add-on registry.');
      setAddons(result.addons || []);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load add-ons.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (addon: AddonItem) => {
    setWorking(addon.id);
    setError('');
    setFeedback('');
    try {
      const response = await fetch(`/api/admin/addons/${encodeURIComponent(addon.id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ enabled: !addon.enabled }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Add-on status could not be saved.');
      setAddons((current) => current.map((item) => item.id === addon.id ? result.addon : item));
      setFeedback(`${addon.name} ${result.addon.enabled ? 'enabled' : 'disabled'}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Add-on status could not be saved.');
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8" aria-labelledby="addons-title">
      <header className="rounded-2xl border border-[#D5A13C]/30 bg-white/80 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-[#35123F]/10 p-3 text-[#35123F]"><Puzzle aria-hidden="true" /></span>
          <div>
            <h1 id="addons-title" className="text-2xl font-bold text-[#24102D]">CMS Modules and Website Add-ons</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#62576A]">
              Enable approved, preinstalled features. Add-on code is registered through the trusted deployment pipeline;
              this manager never executes uploaded code. Core modules stay enabled.
            </p>
          </div>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {feedback && <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{feedback}</p>}

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-[#62576A]"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading registered modules…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addons.map((addon) => (
            <article key={addon.id} className="rounded-2xl border border-[#D5A13C]/25 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-[#24102D]">{addon.name}</h2>
                    <span className="rounded-full bg-[#A855F7]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6B21A8]">
                      {addon.kind === 'core' ? 'Core module' : 'Website add-on'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-[#62576A]">{addon.description}</p>
                </div>
                {addon.enabled
                  ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Enabled" />
                  : <CircleOff className="h-5 w-5 shrink-0 text-slate-400" aria-label="Disabled" />}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[#62576A]">
                <div><dt className="font-semibold text-[#24102D]">Version</dt><dd>{addon.version}</dd></div>
                <div><dt className="font-semibold text-[#24102D]">Compatibility</dt><dd>{addon.compatibility}</dd></div>
                <div><dt className="font-semibold text-[#24102D]">Content types</dt><dd>{addon.contentTypes.join(', ') || 'None'}</dd></div>
                <div className="col-span-2"><dt className="font-semibold text-[#24102D]">Routes</dt><dd className="break-words">{addon.routes.join(', ')}</dd></div>
                <div className="col-span-2"><dt className="font-semibold text-[#24102D]">API</dt><dd className="break-words">{addon.apiRoutes.join(', ') || 'None'}</dd></div>
                <div className="col-span-2"><dt className="font-semibold text-[#24102D]">Dependencies</dt><dd>{addon.dependencies.join(', ') || 'None'} · Migration v{addon.migrationVersion}</dd></div>
                <div className="col-span-2"><dt className="font-semibold text-[#24102D]">Required permissions</dt><dd>{addon.permissions.join(', ')}</dd></div>
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-[#62576A]">{addon.enabled ? 'Enabled' : 'Disabled'}</span>
                {addon.disableable ? (
                  <button
                    type="button"
                    onClick={() => void toggle(addon)}
                    disabled={working === addon.id}
                    aria-pressed={addon.enabled}
                    className="rounded-lg bg-[#35123F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#24102D] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A855F7]"
                  >
                    {working === addon.id ? 'Saving…' : addon.enabled ? 'Disable' : 'Enable'}
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#62576A]"><ShieldCheck className="h-4 w-4" /> Required</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
