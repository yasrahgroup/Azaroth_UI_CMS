import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { SiteSettings, PublicDarkThemeColors } from '../types';
import { useAuth } from './AuthContext';
import { DEFAULT_SETTINGS } from '../constants/defaultSettings';

interface ThemeContextType {
  settings: SiteSettings;
  draftSettings: SiteSettings;
  activeSettings: SiteSettings;
  /**
   * Draft-bound settings used by every CMS editor surface.
   * Editors must read from and write to the same object, otherwise a
   * read-modify-write against published settings silently reverts every
   * other unpublished draft field.
   */
  editorSettings: SiteSettings;
  previewDraft: boolean;
  setPreviewDraft: (val: boolean) => void;
  /** Flushes every pending debounced draft write and resolves when the draft is persisted. */
  flushDraftSettings: () => Promise<boolean>;
  updateDraftSettings: (updates: Partial<SiteSettings>, immediateSync?: boolean) => Promise<boolean>;
  publishSettings: () => Promise<boolean>;
  restoreDefaults: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
  isSaving: boolean;
  isAutoSaving: boolean;
  lastSaveError: string | null;
  setLastSaveError: (err: string | null) => void;
  // Independent CMS Mode
  cmsMode: 'dark' | 'light';
  setCmsMode: (mode: 'dark' | 'light') => void;
  toggleCmsMode: () => void;
  // Independent Public Website Mode
  publicMode: 'light' | 'dark';
  setPublicMode: (mode: 'light' | 'dark') => void;
  togglePublicMode: () => void;
  isPublicDarkModeEnabled: boolean;
  isPublicDarkActive: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper for deep merging partial settings into an existing SiteSettings object
export function mergeSettings(base: SiteSettings, updates: Partial<SiteSettings>): SiteSettings {
  const safeBase = base || DEFAULT_SETTINGS;
  return {
    ...safeBase,
    ...updates,
    header: { ...(safeBase.header || {}), ...(updates.header || {}) },
    footer: { ...(safeBase.footer || {}), ...(updates.footer || {}) },
    theme: {
      ...(safeBase.theme || {}),
      ...(updates.theme || {}),
      darkTheme: {
        ...(safeBase.theme?.darkTheme || {}),
        ...(updates.theme?.darkTheme || {}),
      },
    },
    animation: {
      ...(safeBase.animation || {}),
      ...(updates.animation || {}),
      cursorStudio: {
        ...(safeBase.animation?.cursorStudio || {}),
        ...(updates.animation?.cursorStudio || {}),
      },
      animations: updates.animation?.animations ?? safeBase.animation?.animations,
    },
    cmsAppearance: { ...(safeBase.cmsAppearance || {}), ...(updates.cmsAppearance || {}) },
    chatbot: { ...(safeBase.chatbot || {}), ...(updates.chatbot || {}) },
    productGrid: { ...(safeBase.productGrid || {}), ...(updates.productGrid || {}) },
    typography: { ...(safeBase.typography || {}), ...(updates.typography || {}) },
  } as SiteSettings;
}

export function hydrateSettings(data: any): SiteSettings {
  const footer = data?.footer;
  const footerLogoUrl = footer?.logoUrl;
  const normalizedFooter = footer && typeof footer === 'object'
    ? {
        ...footer,
        ...(Object.prototype.hasOwnProperty.call(footer, 'logoUrl')
          ? {
              logoUrl:
                typeof footerLogoUrl === 'string'
                  ? footerLogoUrl
                  : typeof footerLogoUrl?.url === 'string'
                    ? footerLogoUrl.url
                    : '',
            }
          : {}),
      }
    : footer;

  return mergeSettings(DEFAULT_SETTINGS, {
    ...(data || {}),
    ...(normalizedFooter ? { footer: normalizedFooter } : {}),
  });
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading: authLoading } = useAuth();
  // Always initialize with complete, non-null DEFAULT_SETTINGS to prevent zero-state flashing and unmounting
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [draftSettings, setDraftSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [previewDraft, setPreviewDraftState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (sessionStorage.getItem('ath_preview_draft') === 'true') return true;
    // A preview link opened from the CMS carries ?preview=draft so the draft
    // flag survives the new-tab boundary (sessionStorage does not).
    try {
      return new URL(window.location.href).searchParams.get('preview') === 'draft';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  useEffect(() => {
    const logoUrl = settings.header.logoUrl.trim();
    const favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (logoUrl) {
      const brandIcon = favicon || document.createElement('link');
      brandIcon.rel = 'icon';
      brandIcon.href = logoUrl;
      if (!favicon) document.head.appendChild(brandIcon);
    } else {
      favicon?.remove();
    }
  }, [settings.header.brandName, settings.header.logoUrl]);

  // 1. Independent CMS Mode (stored in localStorage for zero-flash initial render)
  const [cmsMode, setCmsModeState] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ath_cms_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'dark';
  });

  // 2. Independent Public Website Visitor Mode (persisted in localStorage for visitors)
  const [publicMode, setPublicModeState] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ath_public_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<Partial<SiteSettings>>({});
  const debounceResolversRef = useRef<Array<(success: boolean) => void>>([]);
  const flushPromiseRef = useRef<Promise<boolean> | null>(null);
  const saveSeqRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cmsEnableDarkMode = (settings?.theme?.enableDarkMode ?? true) as boolean;

  // The CMS gate. When the administrator disables public dark mode the
  // public site must not offer a dark mode switch at all.
  const isPublicDarkModeEnabled = cmsEnableDarkMode;

  // The state actually applied to the public site. A stored visitor
  // preference can never turn dark mode on while the CMS gate is closed.
  const isPublicDarkActive = publicMode === 'dark' && cmsEnableDarkMode;

  const setCmsMode = useCallback((mode: 'dark' | 'light') => {
    setCmsModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ath_cms_mode', mode);
      if (window.location.pathname.startsWith('/admin')) {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.setAttribute('data-cms-mode', mode);
      }
    }
  }, []);

  const toggleCmsMode = useCallback(() => {
    setCmsMode(cmsMode === 'dark' ? 'light' : 'dark');
  }, [cmsMode, setCmsMode]);

  const setPublicMode = useCallback((mode: 'light' | 'dark') => {
    if (mode === 'dark' && !cmsEnableDarkMode) return;
    setPublicModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ath_public_mode', mode);
      if (!window.location.pathname.startsWith('/admin')) {
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.setAttribute('data-public-theme', mode);
      }
    }
  }, [cmsEnableDarkMode]);

  const setPreviewDraft = useCallback((enabled: boolean) => {
    setPreviewDraftState(enabled);
    if (typeof window === 'undefined') return;
    if (enabled) {
      sessionStorage.setItem('ath_preview_draft', 'true');
    } else {
      sessionStorage.removeItem('ath_preview_draft');
    }
    // Keep the address bar in sync so a refresh restores the same preview
    // state and an exited preview can never be re-entered from a stale URL.
    try {
      const url = new URL(window.location.href);
      if (enabled) {
        url.searchParams.set('preview', 'draft');
      } else {
        url.searchParams.delete('preview');
      }
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    } catch {
      // Non-browser or malformed URL: in-memory state is still updated.
    }
  }, []);

  // Adopt a ?preview=draft link into sessionStorage, then clean the URL so the
  // flag lives for this tab only and cannot leak into a copied/shareable link.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('preview') !== 'draft') return;
      sessionStorage.setItem('ath_preview_draft', 'true');
      url.searchParams.delete('preview');
      window.history.replaceState(
        window.history.state,
        '',
        `${url.pathname}${url.search}${url.hash}`
      );
    } catch {
      // Ignore malformed URLs; the initializer fallback already applies.
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !token && previewDraft) {
      setPreviewDraft(false);
    }
  }, [authLoading, token, previewDraft, setPreviewDraft]);

  const togglePublicMode = useCallback(() => {
    if (!cmsEnableDarkMode) return;
    setPublicMode(publicMode === 'dark' ? 'light' : 'dark');
  }, [publicMode, cmsEnableDarkMode, setPublicMode]);

  // Synchronize route-aware HTML root classes for CMS vs Public Website
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHtmlClass = () => {
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const root = document.documentElement;
        if (isAdminRoute) {
          root.classList.toggle('dark', cmsMode === 'dark');
          root.setAttribute('data-cms-mode', cmsMode);
          root.removeAttribute('data-public-theme');
        } else {
          root.classList.toggle('dark', publicMode === 'dark');
          root.setAttribute('data-public-theme', publicMode);
          root.removeAttribute('data-cms-mode');
        }
      };

      updateHtmlClass();
      window.addEventListener('popstate', updateHtmlClass);
      return () => window.removeEventListener('popstate', updateHtmlClass);
    }
  }, [cmsMode, publicMode]);

  // Synchronize CMS mode with backend settings once loaded
  useEffect(() => {
    const backendMode = (draftSettings || settings)?.cmsAppearance?.mode;
    if (backendMode && (backendMode === 'dark' || backendMode === 'light')) {
      const savedLocal = localStorage.getItem('ath_cms_mode');
      if (!savedLocal) {
        setCmsModeState(backendMode);
      }
    }
  }, [settings, draftSettings]);

  // Enforce the CMS gate on public dark mode.
  // If the admin disables public dark mode, any previously stored visitor
  // preference for "dark" is reset so the public site renders light only.
  useEffect(() => {
    const darkEnabled = settings?.theme?.enableDarkMode ?? false;
    if (!darkEnabled && publicMode === 'dark') {
      setPublicModeState('light');
      if (typeof window !== 'undefined') {
        localStorage.setItem('ath_public_mode', 'light');
        if (!window.location.pathname.startsWith('/admin')) {
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('data-public-theme', 'light');
        }
      }
    }
  }, [settings?.theme?.enableDarkMode, publicMode]);

  // Apply Public Website theme tokens to CSS custom properties
  const applyThemeTokens = useCallback((s: SiteSettings, currentPublicMode: 'light' | 'dark') => {
    const root = document.documentElement;
    if (!s || !s.theme) return;

    // Public dark mode is only applied when the CMS admin enabled it.
    // The visitor preference alone can never turn dark mode on.
    const cmsDarkEnabled = s.theme?.enableDarkMode ?? false;
    const isDarkActive = currentPublicMode === 'dark' && cmsDarkEnabled;
    const darkCfg = s.theme.darkTheme || {
      background: '#0F172A',
      surface: '#1E293B',
      headingInk: '#F8FAFC',
      bodyText: '#CBD5E1',
      mutedText: '#94A3B8',
      borderColor: '#334155',
      headerBg: '#0F172A',
      footerBg: '#0A0F1D',
      buttonBg: s.theme.buttonBg || s.theme.primary,
      buttonText: s.theme.buttonText || '#FFFFFF',
    };

    root.style.setProperty('--color-primary', s.theme.primary);
    root.style.setProperty('--color-secondary', s.theme.secondary);
    root.style.setProperty('--color-accent', s.theme.accent);
    root.style.setProperty('--color-bg', isDarkActive ? darkCfg.background : s.theme.background);
    root.style.setProperty('--color-surface', isDarkActive ? darkCfg.surface : s.theme.surface);
    root.style.setProperty('--color-heading', isDarkActive ? darkCfg.headingInk : s.theme.headingInk);
    root.style.setProperty('--color-body', isDarkActive ? darkCfg.bodyText : s.theme.bodyText);
    root.style.setProperty('--color-muted', isDarkActive ? darkCfg.mutedText : s.theme.mutedText);
    root.style.setProperty('--color-border', isDarkActive ? darkCfg.borderColor : s.theme.borderColor);
    root.style.setProperty('--color-btn-bg', isDarkActive ? (darkCfg.buttonBg || s.theme.buttonBg) : s.theme.buttonBg);
    root.style.setProperty('--color-btn-text', isDarkActive ? (darkCfg.buttonText || s.theme.buttonText) : s.theme.buttonText);
    root.style.setProperty(
      '--color-header-bg',
      isDarkActive ? darkCfg.headerBg : (s.header.backgroundColor || s.theme.headerBg)
    );
    root.style.setProperty(
      '--color-footer-bg',
      isDarkActive ? darkCfg.footerBg : (s.footer.backgroundColor || s.theme.footerBg)
    );
    root.style.setProperty('--color-gradient-start', s.theme.gradientStart || s.theme.primary);
    root.style.setProperty('--color-gradient-end', s.theme.gradientEnd || s.theme.accent);
    root.style.setProperty('--gradient-angle', `${s.theme.gradientAngle ?? 135}deg`);
    root.style.setProperty('--cta-style', s.theme.colorStyle || 'solid');
    root.setAttribute('data-cta-style', s.theme.colorStyle || 'solid');
    root.setAttribute('data-public-theme', isDarkActive ? 'dark' : 'light');

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
      root.classList.toggle('dark', isDarkActive);
    }

    if (s.typography) {
      root.style.setProperty('--font-heading', `"${s.typography.headingFont}", sans-serif`);
      root.style.setProperty('--font-body', `"${s.typography.bodyFont}", sans-serif`);
      root.style.setProperty('--base-font-size', `${s.typography.baseFontSize}px`);
      root.style.setProperty('--letter-spacing', s.typography.letterSpacing);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const pub = hydrateSettings(await res.json());
        setSettings(pub);

        const activeToken = token || localStorage.getItem('ath_token');
        if (activeToken) {
          const draftRes = await fetch('/api/settings/draft', {
            headers: { Authorization: `Bearer ${activeToken}` },
          });
          if (draftRes.ok) {
            const draft = hydrateSettings(await draftRes.json());
            // Don't overwrite in-memory edits that are pending save
            setDraftSettings((current) => {
              if (Object.keys(pendingUpdatesRef.current).length > 0) {
                return mergeSettings(draft, pendingUpdatesRef.current);
              }
              return draft;
            });
          }
        }
      }
    } catch (err) {
      console.warn('[ThemeContext] Settings fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const activeSettings = previewDraft && token ? draftSettings : settings;

  // The CMS editing surface is always bound to the draft so that edits are
  // visible immediately and read-modify-write never reverts sibling draft fields.
  const editorSettings = draftSettings;

  useEffect(() => {
    if (activeSettings) {
      applyThemeTokens(activeSettings, publicMode);
    }
  }, [activeSettings, publicMode, applyThemeTokens]);

  const restorePendingUpdates = (snapshot: Partial<SiteSettings>) => {
    pendingUpdatesRef.current = mergeSettings(
      snapshot as SiteSettings,
      pendingUpdatesRef.current
    );
  };

  const settleDebounceWaiters = (success: boolean) => {
    const waiters = debounceResolversRef.current;
    debounceResolversRef.current = [];
    waiters.forEach((resolve) => resolve(success));
  };

  // Draft writes are serialized. Every response is merged with the still-pending
  // local edits, so a slow request can never revert newer keystrokes.
  const flushDraftUpdates = (): Promise<boolean> => {
    if (flushPromiseRef.current) return flushPromiseRef.current;

    const run = async (): Promise<boolean> => {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      let success = true;
      setIsAutoSaving(true);
      setLastSaveError(null);

      while (Object.keys(pendingUpdatesRef.current).length > 0) {
        const seq = ++saveSeqRef.current;
        const snapshot = pendingUpdatesRef.current;
        pendingUpdatesRef.current = {};

        try {
          const res = await fetch('/api/settings/draft', {
            method: 'POST',
            headers,
            body: JSON.stringify(snapshot),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            restorePendingUpdates(snapshot);
            if (isMountedRef.current) {
              setLastSaveError(errData?.error || 'Failed to save draft settings');
            }
            success = false;
            break;
          }

          const updated = hydrateSettings(await res.json());
          if (seq === saveSeqRef.current && isMountedRef.current) {
            setDraftSettings((current) => mergeSettings(updated, pendingUpdatesRef.current));
            if (previewDraft) {
              applyThemeTokens(updated, publicMode);
            }
          }
        } catch (err: any) {
          restorePendingUpdates(snapshot);
          if (isMountedRef.current) {
            setLastSaveError(err.message || 'Network error saving draft');
          }
          success = false;
          break;
        }
      }

      return success;
    };

    let outcome = false;
    const promise = run()
      .then((result) => {
        outcome = result;
        return result;
      })
      .finally(() => {
        flushPromiseRef.current = null;
        if (isMountedRef.current) {
          setIsAutoSaving(false);
        }
        settleDebounceWaiters(outcome);
      });
    flushPromiseRef.current = promise;
    return promise;
  };

  const updateDraftSettings = async (
    updates: Partial<SiteSettings>,
    immediateSync: boolean = false
  ): Promise<boolean> => {
    setDraftSettings((prev) => mergeSettings(prev, updates));

    pendingUpdatesRef.current = mergeSettings(
      pendingUpdatesRef.current as SiteSettings,
      updates
    );

    if (updates.cmsAppearance?.mode) {
      setCmsMode(updates.cmsAppearance.mode);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (immediateSync) {
      return flushDraftUpdates();
    }

    return new Promise((resolve) => {
      debounceResolversRef.current.push(resolve);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void flushDraftUpdates();
      }, 350);
    });
  };

  const publishSettings = async (): Promise<boolean> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setIsSaving(true);
    setLastSaveError(null);

    try {
      if (Object.keys(pendingUpdatesRef.current).length > 0 || flushPromiseRef.current) {
        const firstFlush = await flushDraftUpdates();
        if (!firstFlush) {
          if (isMountedRef.current) {
            setLastSaveError('Draft changes could not be saved. Fix the save error and publish again.');
          }
          return false;
        }
        if (Object.keys(pendingUpdatesRef.current).length > 0) {
          const secondFlush = await flushDraftUpdates();
          if (!secondFlush || Object.keys(pendingUpdatesRef.current).length > 0) {
            if (isMountedRef.current) {
              setLastSaveError('Draft changes are still pending. Publish was cancelled.');
            }
            return false;
          }
        }
      }

      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/settings/publish', {
        method: 'POST',
        headers,
      });

      if (res.ok) {
        const published = hydrateSettings(await res.json());
        setSettings(published);
        setDraftSettings(published);
        pendingUpdatesRef.current = {};
        setPreviewDraft(false);
        applyThemeTokens(published, publicMode);
        return true;
      } else {
        const errData = await res.json().catch(() => null);
        setLastSaveError(errData?.error || 'Publish failed');
        return false;
      }
    } catch (err: any) {
      setLastSaveError(err.message || 'Network error during publish');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const restoreDefaults = async (): Promise<boolean> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    settleDebounceWaiters(false);
    setIsSaving(true);
    setLastSaveError(null);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/settings/restore-defaults', {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const restored = await res.json();
        setSettings(restored);
        setDraftSettings(restored);
        setPreviewDraft(false);
        pendingUpdatesRef.current = {};
        applyThemeTokens(restored, publicMode);
        return true;
      }
      const errData = await res.json().catch(() => null);
      if (isMountedRef.current) {
        setLastSaveError(errData?.error || 'Restore defaults failed');
      }
      return false;
    } catch (err: any) {
      if (isMountedRef.current) {
        setLastSaveError(err?.message || 'Network error restoring defaults');
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        draftSettings,
        activeSettings,
        editorSettings,
        previewDraft,
        setPreviewDraft,
        flushDraftSettings: flushDraftUpdates,
        updateDraftSettings,
        publishSettings,
        restoreDefaults,
        refreshSettings,
        isLoading,
        isSaving,
        isAutoSaving,
        lastSaveError,
        setLastSaveError,
        cmsMode,
        setCmsMode,
        toggleCmsMode,
        publicMode,
        setPublicMode,
        togglePublicMode,
        isPublicDarkModeEnabled,
        isPublicDarkActive,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
