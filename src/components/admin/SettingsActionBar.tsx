import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, RotateCcw, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

type SettingsAction = 'restore' | 'save' | 'publish';

interface SettingsActionBarProps {
  isLight?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  labels?: Partial<Record<SettingsAction, string>>;
  onFeedback?: (message: string) => void;
  onRestored?: () => void;
  onSaved?: () => void;
  onPublished?: () => void;
}

const DEFAULT_LABELS: Record<SettingsAction, string> = {
  restore: 'Restore Default',
  save: 'Save',
  publish: 'Publish',
};

const BUSY_LABELS: Record<SettingsAction, string> = {
  restore: 'Restoring...',
  save: 'Saving...',
  publish: 'Publishing...',
};

const SUCCESS_LABELS: Record<SettingsAction, string> = {
  restore: 'Defaults restored',
  save: 'Draft saved',
  publish: 'Published live',
};

const ERROR_LABELS: Record<SettingsAction, string> = {
  restore: 'Could not restore defaults',
  save: 'Could not save draft',
  publish: 'Could not publish',
};

export const SettingsActionBar: React.FC<SettingsActionBarProps> = ({
  isLight = false,
  size = 'md',
  className = '',
  disabled = false,
  labels,
  onFeedback,
  onRestored,
  onSaved,
  onPublished,
}) => {
  const { restoreDefaults, flushDraftSettings, publishSettings, isSaving, isAutoSaving } = useTheme();
  const [busy, setBusy] = useState<SettingsAction | null>(null);
  const [status, setStatus] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const text = { ...DEFAULT_LABELS, ...labels };
  const isDisabled = disabled || isSaving || isAutoSaving || busy !== null;
  const isCompact = size === 'sm';

  const runAction = async (action: SettingsAction) => {
    if (isDisabled) return;
    setBusy(action);
    setStatus(null);
    try {
      const ok =
        action === 'restore'
          ? await restoreDefaults()
          : action === 'save'
            ? await flushDraftSettings()
            : await publishSettings();

      if (ok) {
        const message = SUCCESS_LABELS[action];
        setStatus({ tone: 'success', message });
        onFeedback?.(message);
        if (action === 'restore') onRestored?.();
        else if (action === 'save') onSaved?.();
        else onPublished?.();
      } else {
        setStatus({ tone: 'error', message: ERROR_LABELS[action] });
      }
    } catch {
      setStatus({ tone: 'error', message: ERROR_LABELS[action] });
    } finally {
      setBusy(null);
    }
  };

  const buttonBase = `flex items-center gap-1.5 rounded font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
    isCompact ? 'px-2.5 sm:px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-xs'
  }`;

  const neutral = isLight
    ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
    : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800';

  const accent = isLight
    ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
    : 'border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}>
      <div aria-live="polite" className="flex items-center">
        {status && !onFeedback && (
          <span
            role="status"
            className={`hidden md:inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium ${
              status.tone === 'success'
                ? isLight
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-emerald-500/10 text-emerald-300'
                : isLight
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-rose-500/10 text-rose-300'
            }`}
          >
            {status.tone === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {status.message}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => runAction('restore')}
        disabled={isDisabled}
        className={`${buttonBase} ${neutral}`}
        title="Restore factory default settings"
      >
        <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden sm:inline">{busy === 'restore' ? BUSY_LABELS.restore : text.restore}</span>
      </button>

      <button
        type="button"
        onClick={() => runAction('save')}
        disabled={isDisabled}
        className={`${buttonBase} ${accent}`}
        title="Save changes to draft"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{busy === 'save' ? BUSY_LABELS.save : text.save}</span>
      </button>

      <button
        type="button"
        onClick={() => runAction('publish')}
        disabled={isDisabled}
        className={`${buttonBase} justify-center bg-[#35123F] text-white hover:bg-[#24102D] uppercase tracking-wider font-semibold shadow-xs ${
          isCompact ? 'px-3 sm:px-4' : 'px-4'
        }`}
        title="Publish the saved draft to the live site"
      >
        <Check className="w-3.5 h-3.5" />
        <span>{busy === 'publish' ? BUSY_LABELS.publish : text.publish}</span>
      </button>
    </div>
  );
};
