import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Palette,
  Type,
  Navigation,
  PanelBottom,
  Layers,
  Box,
  Image,
  MessageSquare,
  Inbox,
  Server,
  LogOut,
  ExternalLink,
  Eye,
  RotateCcw,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  LayoutDashboard,
  Sun,
  Moon,
  AlertCircle,
  Users,
  UserRound,
  Puzzle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SettingsActionBar } from './SettingsActionBar';
import { saveDraftBeforePreview } from '../../utils/previewHandoff';

/**
 * Resolves whether a configured sidebar colour is light enough to need dark
 * controls. The sidebar keeps its configured brand colour in both CMS modes,
 * so its text and controls must follow that colour instead of the page mode.
 */
const isLightHexColor = (value?: string): boolean => {
  if (!value) return false;
  const hex = value.trim().replace('#', '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return false;
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255 > 0.62;
};

interface AdminErrorBoundaryProps {
  children: React.ReactNode;
}

interface AdminErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends React.Component<AdminErrorBoundaryProps, AdminErrorBoundaryState> {
  constructor(props: AdminErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AdminErrorBoundary] Captured module error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-2xl border border-rose-800/40 bg-rose-950/20 text-center max-w-xl mx-auto my-12 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Module Recovered</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {this.state.error?.message || 'An unexpected rendering error occurred in this module.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin, isEditor } = useAuth();
  const {
    editorSettings,
    updateDraftSettings,
    flushDraftSettings,
    isAutoSaving,
    lastSaveError,
    setLastSaveError,
    cmsMode,
    toggleCmsMode,
  } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isLight = cmsMode === 'light';

  const mainScrollRef = React.useRef<HTMLElement | null>(null);
  const prevSectionRef = React.useRef<string>('');

  useEffect(() => {
    const currentSection = location.pathname.split('/')[2] || 'index';
    if (prevSectionRef.current && prevSectionRef.current !== currentSection && mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    prevSectionRef.current = currentSection;
  }, [location.pathname]);


  const cmsApp = editorSettings?.cmsAppearance || {
    mode: 'light' as const,
    sidebarBg: '#35123F',
    sidebarText: '#F2EEF4',
    sidebarActiveBg: '#A855F7',
    sidebarActiveText: '#FFFFFF',
    accentColor: '#D5A13C',
    topbarBg: '#FAF7F2',
    primaryBrand: '#35123F',
    syncWithWebsiteTheme: false,
    cmsName: '',
  };

  const sidebarBg = cmsApp.syncWithWebsiteTheme
    ? (editorSettings?.theme?.primary || '#35123F')
    : (cmsApp.sidebarBg || '#35123F');

  const activeBg = cmsApp.syncWithWebsiteTheme
    ? (editorSettings?.theme?.primary || '#35123F')
    : (cmsApp.sidebarActiveBg || '#35123F');

  // The sidebar remains brand-coloured in both CMS modes. Derive its own
  // foreground and control surfaces so light-mode page chrome never leaks into
  // the dark sidebar (or leaves dark text on a light custom sidebar).
  const sidebarText = cmsApp.sidebarText || '#F2EEF4';
  const sidebarIsLight = isLightHexColor(sidebarBg);
  const sidebarBorderColor = sidebarIsLight
    ? 'rgba(15, 23, 42, 0.12)'
    : 'rgba(255, 255, 255, 0.12)';
  const sidebarControlClass = sidebarIsLight
    ? 'bg-black/5 hover:bg-black/10'
    : 'bg-white/10 hover:bg-white/15';
  const sidebarHoverClass = sidebarIsLight
    ? 'hover:bg-black/5'
    : 'hover:bg-white/10';

  const accentColor = cmsApp.syncWithWebsiteTheme
    ? (editorSettings?.theme?.accent || '#D5A13C')
    : (cmsApp.accentColor || '#D5A13C');

  const brandName = cmsApp.cmsName?.trim()
    ? cmsApp.cmsName.trim()
    : editorSettings?.header?.brandName
      ? `${editorSettings.header.brandName.trim()} CMS`
      : 'Azaroth CMS';

  // CMS sidebar logo configuration (white-label branding). Falls back to the
  // platform brand mark when no customer logo is configured.
  const sidebarLogoUrl = cmsApp.sidebarLogoUrl;
  const sidebarLogoAlt = cmsApp.sidebarLogoAlt || 'Company Logo';
  const sidebarLogoWidth = cmsApp.sidebarLogoWidth || 120;
  const sidebarLogoHeight = cmsApp.sidebarLogoHeight || 36;
  const sidebarCompactLogoUrl = cmsApp.sidebarCompactLogoUrl;
  const sidebarCompactLogoAlt = cmsApp.sidebarCompactLogoAlt || 'Compact Logo';

  // Tracks whether the configured sidebar logo failed to load (e.g. deleted asset)
  // so we can fall back to the platform brand mark gracefully.
  // Desktop sidebar collapse state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ath_admin_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('ath_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [sidebarLogoLoadError, setSidebarLogoLoadError] = useState(false);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Draft preview opens the public website in a new tab with the unpublished
  // draft enabled. Pending debounced writes are flushed first so the preview
  // can never show an older draft than the editor is currently displaying.
  const [isOpeningPreview, setIsOpeningPreview] = useState(false);

  const handleOpenDraftPreview = async () => {
    if (isOpeningPreview) return;

    // Open synchronously so the browser keeps the user-gesture popup
    // permission; the tab is navigated once pending draft writes are flushed.
    const previewWindow = window.open('about:blank', '_blank');
    if (previewWindow) {
      try {
        previewWindow.opener = null;
      } catch {
        // Cross-origin safety is handled by the navigation below.
      }
    }

    setIsOpeningPreview(true);
    setLastSaveError(null);
    try {
      const saved = await flushDraftSettings();
      if (!saved) {
        previewWindow?.close();
        setLastSaveError('Draft changes could not be saved. Preview was not opened.');
        return;
      }
      const activeEditor = await saveDraftBeforePreview();
      if (!activeEditor.saved) {
        previewWindow?.close();
        setLastSaveError('Draft changes could not be saved. Preview was not opened.');
        return;
      }
      const previewUrl = new URL(activeEditor.path || '/', window.location.origin);
      previewUrl.searchParams.set('preview', 'draft');
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.replace(previewUrl.toString());
      } else {
        window.open(previewUrl.toString(), '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsOpeningPreview(false);
    }
  };

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Reset logo load error when the configured logo URL changes
  useEffect(() => {
    setSidebarLogoLoadError(false);
  }, [sidebarLogoUrl, sidebarCompactLogoUrl]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // CMS Settings is always anchored at the bottom of the sidebar navigation,
  // after all regular navigation items. Its relative order among regular items
  // is preserved, and it remains accessible in both expanded and collapsed modes.
  const cmsSettingsItem = { label: 'CMS Settings Hub', path: '/admin/settings', icon: Settings };
  const teamAccessItem = { label: 'Team & Access', path: '/admin/users', icon: Users };
  const addonManagerItem = { label: 'Modules & Add-ons', path: '/admin/addons', icon: Puzzle };

  const editorNavItems = [
    { label: 'Branding & Header', path: '/admin/branding', icon: Navigation },
    { label: 'Footer Manager', path: '/admin/footer', icon: PanelBottom },
    { label: 'Theme & Colors', path: '/admin/theme', icon: Palette },
    { label: 'Typography', path: '/admin/typography', icon: Type },
    { label: 'Animation Studio', path: '/admin/animations', icon: Sparkles },
    { label: 'Page Builder', path: '/admin/pages', icon: Layers },
    { label: 'Products', path: '/admin/products', icon: Box },
    { label: 'Media Library', path: '/admin/media', icon: Image },
    { label: 'Chatbot & FAQs', path: '/admin/chatbot', icon: MessageSquare },
    { label: 'Leads & Enquiries', path: '/admin/inbox', icon: Inbox },
  ];

  const regularNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    ...(isEditor ? editorNavItems : []),
    { label: 'Deployment & Health', path: '/admin/deployment', icon: Server },
  ];

  const navItems = [
    ...regularNavItems,
    ...(isEditor ? [cmsSettingsItem] : []),
    ...(isAdmin ? [teamAccessItem] : []),
    ...(isAdmin ? [addonManagerItem] : []),
  ];

  return (
    <div
      data-cms-mode={cmsMode}
      className={`h-screen w-full max-w-full overflow-hidden flex ${
        isLight ? 'bg-[#FAF7F2] text-slate-900' : 'bg-[#0B0D17] text-slate-100 dark'
      }`}
    >
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Fixed height, independent scrolling container that never unmounts */}
      <aside
        style={{ backgroundColor: sidebarBg }}
        className={`relative flex flex-col shrink-0 transition-[width] duration-200 ease-in-out z-50 h-full ${
          isLight ? 'border-r border-white/15 text-white' : 'border-r border-slate-800 text-slate-300'
        } ${
          mobileDrawerOpen
            ? 'fixed inset-y-0 left-0 w-64 translate-x-0 shadow-2xl'
            : 'fixed inset-y-0 left-0 -translate-x-full lg:translate-x-0'
        } lg:static lg:h-full ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}`}
      >
        {/* Dedicated Sidebar Arrow Toggle Button */}
        <button
          type="button"
          onClick={toggleCollapse}
          className={`hidden lg:flex absolute -right-3 top-5 z-50 w-6 h-6 rounded-full border shadow-md items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
            isLight
              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-slate-200'
              : 'bg-[#1E2337] border-slate-700 text-slate-200 hover:bg-[#282F49] shadow-black/40'
          }`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Brand Header */}
        <div
          className="h-16 px-3.5 border-b flex items-center justify-between shrink-0 overflow-hidden"
          style={{ backgroundColor: sidebarBg, borderBottomColor: sidebarBorderColor }}
        >
          <div className={`flex items-center gap-3 overflow-hidden min-w-0 ${isCollapsed ? 'justify-center w-full' : ''}`}>
            {(!sidebarLogoLoadError && (isCollapsed ? (sidebarCompactLogoUrl || sidebarLogoUrl) : (sidebarLogoUrl || sidebarCompactLogoUrl))) ? (
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={isCollapsed ? (sidebarCompactLogoUrl || sidebarLogoUrl) : (sidebarLogoUrl || sidebarCompactLogoUrl)}
                  alt={sidebarLogoAlt}
                  style={{
                    maxHeight: isCollapsed ? '32px' : `${sidebarLogoHeight || 38}px`,
                    maxWidth: isCollapsed ? '32px' : `${sidebarLogoWidth || 140}px`,
                    width: 'auto',
                    height: 'auto',
                  }}
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setSidebarLogoLoadError(true)}
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#35123F] to-[#171B2C] border border-[#D5A13C]/40 flex items-center justify-center text-white shrink-0 shadow-xs">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#D5A13C" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 6L7 9V15L12 18L17 15V9L12 6Z" fill="#35123F" stroke="#FAF7F2" strokeWidth="1" />
                  <circle cx="12" cy="12" r="2" fill="#D5A13C" />
                </svg>
              </div>
            )}
            {!isCollapsed && (
              <div className="truncate min-w-0">
                <span
                  className="font-bold text-sm tracking-tight truncate block"
                  style={{ color: sidebarText }}
                >
                  {brandName}
                </span>
                <p className="text-[11px] truncate font-medium" style={{ color: accentColor }}>
                  Enterprise Studio
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className={`lg:hidden p-1.5 rounded cursor-pointer ${sidebarHoverClass}`}
            style={{ color: sidebarText }}
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items: Smooth scroll container */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.path ||
              (item.path === '/admin' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) ||
              (item.path === '/admin/branding' && location.pathname === '/admin/header');
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                style={
                  active
                    ? { backgroundColor: activeBg, color: '#FFFFFF' }
                    : { color: sidebarText }
                }
                className={`flex items-center rounded-lg text-xs font-medium transition-all ${
                  isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  active
                    ? 'text-white shadow-xs font-bold'
                    : `opacity-80 hover:opacity-100 ${sidebarHoverClass}`
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'opacity-80'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer: User profile & Logout */}
        <div
          className="p-3 border-t shrink-0"
          style={{ backgroundColor: sidebarBg, borderTopColor: sidebarBorderColor }}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Link
                to="/admin/profile"
                className={`w-8 h-8 rounded-full border border-[#D5A13C]/40 flex items-center justify-center text-[11px] font-bold text-[#D5A13C] hover:border-[#D5A13C] transition-colors ${sidebarControlClass}`}
                title={`${user?.name || 'Admin'} (${user?.role || 'admin'}) — Open profile`}
                aria-label="Open my profile"
              >
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={handleLogout}
                className={`p-2 rounded text-xs transition-colors flex items-center justify-center cursor-pointer ${sidebarControlClass}`}
                style={{ color: sidebarText }}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Link
                to="/admin/profile"
                className={`block rounded-lg p-2 -m-1 transition-colors group ${sidebarHoverClass}`}
                title="Open my profile"
              >
                <p className="font-semibold truncate" style={{ color: sidebarText }}>
                  {user?.name || 'Administrator'}
                </p>
                <p className="text-[11px] truncate opacity-70" style={{ color: sidebarText }}>
                  {user?.email}
                </p>
                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] uppercase font-bold text-[#D5A13C]">
                  <UserRound className="w-3 h-3" />
                  Role: {user?.role || 'admin'} — My Profile
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className={`w-full py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer ${sidebarControlClass}`}
                style={{ color: sidebarText }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar: Pinned at the top */}
        <header
          className={`h-16 shrink-0 border-b px-4 sm:px-6 flex items-center justify-between gap-3 z-20 shadow-2xs ${
            isLight
              ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-[#D5A13C]/20'
              : 'bg-[#131624]/95 backdrop-blur-md border-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className={`lg:hidden p-2 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-[#35123F]" />
            </button>

            <span className={isLight ? 'text-slate-300 hidden sm:inline' : 'text-slate-700 hidden sm:inline'}>|</span>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`text-xs font-semibold flex items-center gap-1.5 p-1.5 sm:p-0 rounded transition-colors ${
                isLight ? 'text-slate-600 hover:text-[#35123F]' : 'text-slate-300 hover:text-white'
              }`}
              title="Open Public Website"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Public Site</span>
            </a>

            <span className={isLight ? 'text-slate-300 hidden md:inline' : 'text-slate-700 hidden md:inline'}>|</span>

            {/* Independent CMS Theme Mode Toggle (Dark / Light) */}
            <button
              onClick={() => {
                toggleCmsMode();
                updateDraftSettings({
                  cmsAppearance: {
                    ...cmsApp,
                    mode: isLight ? 'dark' : 'light',
                  },
                });
              }}
              className={`p-1.5 px-2 sm:px-2.5 rounded-lg border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-200'
              }`}
              title={isLight ? 'Switch CMS Portal to Dark Mode' : 'Switch CMS Portal to Light Mode'}
              aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {isLight ? (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden md:inline font-medium">CMS: {isLight ? 'Light' : 'Dark'}</span>
            </button>

            <span className={isLight ? 'text-slate-300 hidden lg:inline' : 'text-slate-700 hidden lg:inline'}>|</span>

            <button
              type="button"
              onClick={handleOpenDraftPreview}
              disabled={isOpeningPreview}
              data-testid="admin-preview-draft"
              className={`text-xs font-medium flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                isLight
                  ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50 border border-transparent hover:border-amber-200'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/30'
              }`}
              title="Open the unpublished draft in a new tab"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{isOpeningPreview ? 'Opening Preview...' : 'Preview Draft'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {isAutoSaving && (
              <span className="text-[11px] font-medium text-amber-500 animate-pulse hidden md:inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Saving draft...</span>
              </span>
            )}
            <SettingsActionBar isLight={isLight} size="sm" />
          </div>
        </header>

        {/* Scrollable Content Container: Preserves layout across sub-route navigations */}
        <main
          ref={mainScrollRef}
          className={`flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 ${
            isLight ? 'bg-[#FAF7F2] text-slate-900' : 'bg-[#0B0D17] text-slate-100'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            {/* Global async-operation feedback: surfaces any failed save/publish
                so an operation can never silently report success. */}
            {lastSaveError && (
              <div
                role="alert"
                className={`mb-4 px-4 py-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  isLight
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{lastSaveError}</span>
                <button
                  type="button"
                  onClick={() => setLastSaveError(null)}
                  className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <AdminErrorBoundary>
              {children || <Outlet />}
            </AdminErrorBoundary>
          </div>

        </main>
      </div>
    </div>
  );
};
