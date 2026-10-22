import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Navigation,
  PanelBottom,
  Palette,
  Type,
  Sparkles,
  Layers,
  Box,
  Image as ImageIcon,
  MessageSquare,
  Sliders,
  Moon,
  Sun,
  Check,
  ArrowRight,
  ExternalLink,
  Shield,
  Search,
  Paintbrush,
  Eye,
  CheckCircle2,
  Upload,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SettingsActionBar } from '../../components/admin/SettingsActionBar';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { uploadAdminMedia } from '../../utils/mediaUpload';
import type { CmsAppearanceConfig } from '../../types';

export const CentralSettingsHub: React.FC = () => {
  const {
    editorSettings,
    updateDraftSettings,
    cmsMode,
  } = useTheme();
  const isLight = cmsMode === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showSidebarMediaPicker, setShowSidebarMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'expanded' | 'compact'>('expanded');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const header = editorSettings?.header;
  const footer = editorSettings?.footer;
  const theme = editorSettings?.theme;
  const cmsApp: CmsAppearanceConfig = editorSettings?.cmsAppearance || {
    mode: 'dark',
    sidebarBg: '#171B2C',
    sidebarText: '#94A3B8',
    sidebarActiveBg: '#35123F',
    sidebarActiveText: '#FFFFFF',
    accentColor: '#D5A13C',
    topbarBg: '#131624',
    primaryBrand: '#35123F',
    syncWithWebsiteTheme: false,
    cmsName: '',
    sidebarLogoUrl: '',
    sidebarLogoAlt: 'Company Logo',
    sidebarLogoWidth: 120,
    sidebarLogoHeight: 36,
    sidebarCompactLogoUrl: '',
    sidebarCompactLogoAlt: 'Compact Logo',
  };

  const handleUpdateCmsAppearance = async (field: keyof CmsAppearanceConfig, value: any) => {
    const updated = {
      ...cmsApp,
      [field]: value,
    };
    await updateDraftSettings({ cmsAppearance: updated });
    setFeedback('CMS appearance updated in draft');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, compact = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await uploadAdminMedia(file);
      if (result.ok) {
        const field: keyof CmsAppearanceConfig = compact ? 'sidebarCompactLogoUrl' : 'sidebarLogoUrl';
        await handleUpdateCmsAppearance(field, result.media.url);
        setFeedback(compact ? 'Compact logo uploaded successfully' : 'Company logo uploaded successfully');
      } else {
        setFeedback(result.error);
      }
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const categories = [
    {
      id: 'branding',
      title: 'Branding & Identity',
      path: '/admin/branding',
      icon: Navigation,
      badge: header?.brandName || 'Configured',
      description: 'Customize company logo, brand name, sub-name, inline/stacked layout, typography, and logo-to-brand spacing.',
      quickInfo: `Brand: "${header?.brandName || 'Azaroth'}" ${header?.brandSubName ? `· ${header.brandSubName}` : ''}`,
    },
    {
      id: 'theme',
      title: 'Theme & Color Palette',
      path: '/admin/theme',
      icon: Palette,
      badge: theme?.distributionPreset || 'Solid',
      description: 'Configure primary, secondary, accent colors, surface backgrounds, text ink, and button color styles.',
      quickInfo: `Primary: ${theme?.primary || '#35123F'} · Accent: ${theme?.accent || '#D5A13C'}`,
    },
    {
      id: 'header-layout',
      title: 'Header Layout & Behavior',
      path: '/admin/branding',
      icon: Navigation,
      badge: '4 Arrangements',
      description: 'Select from 4 header arrangements (Logo Left/Right, Nav Center/Right, CTA placement), sticky navbar, and transparency.',
      quickInfo: `Current: ${header?.layoutPreset || 'logo-left-nav-right'}`,
    },
    {
      id: 'footer-layout',
      title: 'Footer Layout & Behavior',
      path: '/admin/footer',
      icon: PanelBottom,
      badge: footer?.layoutPreset || 'Standard',
      description: 'Configure footer layout arrangement, LTR/RTL text direction, and column management.',
      quickInfo: `Preset: ${footer?.layoutPreset || 'standard'} · Dir: ${footer?.direction || 'ltr'}`,
    },
    {
      id: 'cms-appearance',
      title: 'CMS Interface Theming',
      path: '#cms-appearance-panel',
      icon: Paintbrush,
      badge: cmsApp.mode === 'light' ? 'Light Mode' : 'Dark Mode',
      description: 'Independent appearance customization for the CMS portal itself: light/dark modes, sidebar colors, and brand sync.',
      quickInfo: `Mode: ${cmsApp.mode} · Sync: ${cmsApp.syncWithWebsiteTheme ? 'Enabled' : 'Independent'}`,
      isAnchor: true,
    },
    {
      id: 'typography',
      title: 'Typography & Scale',
      path: '/admin/typography',
      icon: Type,
      badge: editorSettings?.typography?.headingFont || 'Plus Jakarta',
      description: 'Configure heading and body typography from Google Fonts, base font sizing, scale multipliers, and letter spacing.',
      quickInfo: `Font: ${editorSettings?.typography?.headingFont || 'Plus Jakarta Sans'}`,
    },
    {
      id: 'animation',
      title: 'Animation Studio & Cursor',
      path: '/admin/animations',
      icon: Sparkles,
      badge: editorSettings?.animation?.cursorStyle || 'Ring',
      description: 'Interactive studio for cursor followers (4 styles), hover scales, scroll reveals, magnetic buttons, and custom rules.',
      quickInfo: `Follower: ${editorSettings?.animation?.cursorFollower ? 'Active' : 'Disabled'}`,
    },
    {
      id: 'page-builder',
      title: 'Page Builder & Appearance',
      path: '/admin/pages',
      icon: Layers,
      badge: 'Multi-Page CMS',
      description: 'Full visual builder supporting surface-only, banner backgrounds, and gradient overlays across all internal pages.',
      quickInfo: 'Independent section controls & starter templates',
    },
    {
      id: 'chatbot',
      title: 'Chatbot Appearance & FAQs',
      path: '/admin/chatbot',
      icon: MessageSquare,
      badge: editorSettings?.chatbot?.enabled ? 'Enabled' : 'Disabled',
      description: 'Independent chatbot color customizer, theme inheritance, 4 curated presets, automated greetings, and FAQ rules.',
      quickInfo: `Advisor: "${editorSettings?.chatbot?.botName || 'Solutions Advisor'}"`,
    },
    {
      id: 'products',
      title: 'Products & Solutions Catalog',
      path: '/admin/products',
      icon: Box,
      badge: 'Flagship Suites',
      description: 'Manage flagship product catalog, deployment stages (Under Dev, Deployment, Launch, Live), and hero graphics.',
      quickInfo: 'Color-coded stages & clean titles (no raw route strings)',
    },
    {
      id: 'media',
      title: 'Media & Asset Library',
      path: '/admin/media',
      icon: ImageIcon,
      badge: 'Centralized Assets',
      description: 'Centralized repository for logos, hero images, banner backgrounds, product assets, and avatar graphics.',
      quickInfo: 'Reusable across all builders and managers',
    },
    {
      id: 'inbox',
      title: 'Leads, Advisory & Inquiries',
      path: '/admin/inbox',
      icon: Sliders,
      badge: 'Lead Telemetry',
      description: 'Unified telemetry capturing technical advisory requests, discovery calls, and chatbot qualification leads.',
      quickInfo: 'Status tracking & customer interest telemetry',
    },
  ];

  const filtered = categories.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.quickInfo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div
        className={`p-6 sm:p-8 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#35123F]">
            <Settings className="w-3.5 h-3.5 text-[#D5A13C]" />
            <span>Centralized Platform Hub</span>
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            CMS Settings & Customization
          </h1>
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            Configure branding, visual themes, header and footer layouts, animation studio, page styling, and the CMS interface itself without editing source code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {feedback && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{feedback}</span>
            </span>
          )}

          <SettingsActionBar
            isLight={isLight}
            onFeedback={(message) => {
              setFeedback(message);
              setTimeout(() => setFeedback(null), 2500);
            }}
            labels={{ publish: 'Publish All Live' }}
          />
        </div>
      </div>

      {/* Quick Search & Filter */}
      <div className="relative">
        <Search className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customization settings (e.g. Logo, Footer, Theme, Colors, Chatbot, Cursor)..."
          className={`w-full pl-11 pr-4 py-3 border rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#35123F] shadow-2xs transition-colors ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              : 'bg-[#131624] border-slate-800 text-white placeholder:text-slate-500'
          }`}
        />
      </div>

      {/* 12 Customization Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className={`rounded-xl border p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-[#35123F]/40'
                  : 'bg-[#131624] border-slate-800 hover:border-[#35123F]/50'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      isLight
                        ? 'bg-slate-100 group-hover:bg-[#35123F]/10 text-slate-700 group-hover:text-[#35123F]'
                        : 'bg-slate-800/80 group-hover:bg-[#35123F]/20 text-slate-300 group-hover:text-[#D5A13C]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                      isLight
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {cat.badge}
                  </span>
                </div>

                <div>
                  <h3
                    className={`text-sm font-bold transition-colors ${
                      isLight
                        ? 'text-slate-900 group-hover:text-[#35123F]'
                        : 'text-white group-hover:text-[#D5A13C]'
                    }`}
                  >
                    {cat.title}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed mt-1 ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {cat.description}
                  </p>
                </div>
              </div>

              <div
                className={`pt-4 mt-4 border-t flex items-center justify-between text-xs ${
                  isLight ? 'border-slate-100' : 'border-slate-800/80'
                }`}
              >
                <span
                  className={`text-[11px] font-mono truncate max-w-[180px] ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {cat.quickInfo}
                </span>

                {cat.isAnchor ? (
                  <a
                    href={cat.path}
                    className={`inline-flex items-center gap-1 text-xs font-bold hover:underline ${
                      isLight ? 'text-[#35123F]' : 'text-[#D5A13C]'
                    }`}
                  >
                    <span>Configure</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    to={cat.path}
                    className={`inline-flex items-center gap-1 text-xs font-bold hover:underline ${
                      isLight ? 'text-[#35123F]' : 'text-[#D5A13C]'
                    }`}
                  >
                    <span>Open Editor</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Section: CMS Interface Appearance & Theming */}
      <div
        id="cms-appearance-panel"
        className={`p-6 sm:p-8 rounded-2xl border shadow-xs space-y-6 transition-colors ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
            isLight ? 'border-slate-100' : 'border-slate-800'
          }`}
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#35123F]">
              <Paintbrush className="w-3.5 h-3.5 text-[#D5A13C]" />
              <span>Portal Identity</span>
            </div>
            <h2 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              CMS Interface Appearance & Theming
            </h2>
            <p className={`text-xs max-w-xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Customize the appearance of the administrative portal itself. CMS appearance settings remain completely separate from the public website theme unless synchronized explicitly.
            </p>
          </div>

          {/* Sync Switch */}
          <div
            className={`p-3 border rounded-xl flex items-center gap-3 shrink-0 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div>
              <span className={`block text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Sync with Website Theme
              </span>
              <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {cmsApp.syncWithWebsiteTheme ? 'CMS colors inherit public theme' : 'CMS maintains independent styling'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleUpdateCmsAppearance('syncWithWebsiteTheme', !cmsApp.syncWithWebsiteTheme)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                cmsApp.syncWithWebsiteTheme ? 'bg-[#35123F]' : 'bg-slate-400'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  cmsApp.syncWithWebsiteTheme ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* CMS Light vs Dark Mode Selector */}
        <div className="space-y-3">
          <label className={`block text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            CMS Portal Theme Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <button
              type="button"
              onClick={() => handleUpdateCmsAppearance('mode', 'dark')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                cmsApp.mode === 'dark'
                  ? 'border-[#35123F] ring-2 ring-[#35123F]/20 bg-slate-900 text-white shadow-md'
                  : isLight
                  ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-300'
              }`}
            >
              <Moon className={`w-5 h-5 shrink-0 ${cmsApp.mode === 'dark' ? 'text-[#D5A13C]' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-bold block">Dark Mode (Default Enterprise)</span>
                <span className="text-[11px] opacity-75 leading-relaxed mt-0.5 block">
                  Sleek dark navy navigation sidebar with high-contrast text and metallic gold accents.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateCmsAppearance('mode', 'light')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                cmsApp.mode === 'light'
                  ? isLight
                    ? 'border-[#35123F] ring-2 ring-[#35123F]/20 bg-slate-50 text-slate-900 shadow-md font-semibold'
                    : 'border-[#35123F] ring-2 ring-[#35123F]/20 bg-slate-800 text-white shadow-md font-semibold'
                  : isLight
                  ? 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 text-slate-300'
              }`}
            >
              <Sun className={`w-5 h-5 shrink-0 ${cmsApp.mode === 'light' ? 'text-amber-500' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-bold block">Light Mode (Clean Studio)</span>
                <span className={`text-[11px] leading-relaxed mt-0.5 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Crisp white sidebar and cards with deep slate typography and clear border separators.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* CMS Portal Display Name (white-label) */}
        <div className={`space-y-2 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          <label className={`block text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            CMS Portal Name
          </label>
          <input
            type="text"
            value={cmsApp.cmsName || ''}
            onChange={(e) => handleUpdateCmsAppearance('cmsName', e.target.value)}
            placeholder={`${header?.brandName || 'Company'} CMS`}
            maxLength={60}
            className={`w-full max-w-md px-3 py-2 text-sm rounded-lg border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                : 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
            }`}
          />
          <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Displayed in the admin sidebar and staff login screen. Leave blank to use &quot;{header?.brandName || 'Company'} CMS&quot;.
          </p>
        </div>

        {/* Independent Color Pickers for CMS */}
        {!cmsApp.syncWithWebsiteTheme && (
          <div className={`space-y-3 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <label className={`block text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Independent CMS Color Palette
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-3 rounded-xl border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>CMS Active Nav Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsApp.sidebarActiveBg}
                    onChange={(e) => handleUpdateCmsAppearance('sidebarActiveBg', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={cmsApp.sidebarActiveBg}
                    onChange={(e) => handleUpdateCmsAppearance('sidebarActiveBg', e.target.value)}
                    className={`w-full px-2 py-1 text-xs font-mono uppercase rounded border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-xl border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>CMS Accent Highlight</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsApp.accentColor}
                    onChange={(e) => handleUpdateCmsAppearance('accentColor', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={cmsApp.accentColor}
                    onChange={(e) => handleUpdateCmsAppearance('accentColor', e.target.value)}
                    className={`w-full px-2 py-1 text-xs font-mono uppercase rounded border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-3 rounded-xl border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
                <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>CMS Sidebar Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cmsApp.sidebarBg}
                    onChange={(e) => handleUpdateCmsAppearance('sidebarBg', e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={cmsApp.sidebarBg}
                    onChange={(e) => handleUpdateCmsAppearance('sidebarBg', e.target.value)}
                    className={`w-full px-2 py-1 text-xs font-mono uppercase rounded border ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* White-Label Company Logo & Identity Card */}
        <div className={`pt-6 border-t space-y-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>
                <ImageIcon className="w-4 h-4 text-[#35123F]" />
                <span>White-Label Company Logo & Sidebar Identity</span>
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Upload your client company logo and brand mark to fully white-label this CMS admin portal sidebar.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold self-start sm:self-auto">
              White-Label Ready
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Primary Sidebar Logo */}
            <div className={`p-4 border rounded-xl space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  Primary Company Logo (Sidebar Header)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">PNG / SVG / WebP</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={cmsApp.sidebarLogoUrl || ''}
                  onChange={(e) => handleUpdateCmsAppearance('sidebarLogoUrl', e.target.value)}
                  placeholder="Paste URL or upload image"
                  className={`flex-1 px-3 py-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#35123F] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget('expanded');
                      setShowSidebarMediaPicker(true);
                    }}
                    className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#35123F]" />
                    <span>Media Library</span>
                  </button>
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleUploadLogo(e, false)}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {cmsApp.sidebarLogoUrl && (
                <div className={`p-3 border rounded-lg flex items-center justify-between gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <img
                      src={cmsApp.sidebarLogoUrl}
                      alt={cmsApp.sidebarLogoAlt || 'Company Logo'}
                      style={{
                        maxHeight: `${cmsApp.sidebarLogoHeight || 36}px`,
                        maxWidth: `${cmsApp.sidebarLogoWidth || 120}px`,
                      }}
                      className="object-contain p-1 rounded bg-slate-50 border border-slate-200"
                    />
                    <div className="text-[11px]">
                      <span className={`font-semibold block truncate max-w-[180px] ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                        {cmsApp.sidebarLogoAlt || 'Company Logo'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cmsApp.sidebarLogoWidth || 120}px × {cmsApp.sidebarLogoHeight || 36}px
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateCmsAppearance('sidebarLogoUrl', '')}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                    title="Remove Logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Display Width ({cmsApp.sidebarLogoWidth || 120}px)
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    step="5"
                    value={cmsApp.sidebarLogoWidth || 120}
                    onChange={(e) => handleUpdateCmsAppearance('sidebarLogoWidth', Number(e.target.value))}
                    className="w-full accent-[#35123F]"
                  />
                </div>
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Max Height ({cmsApp.sidebarLogoHeight || 36}px)
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="50"
                    step="2"
                    value={cmsApp.sidebarLogoHeight || 36}
                    onChange={(e) => handleUpdateCmsAppearance('sidebarLogoHeight', Number(e.target.value))}
                    className="w-full accent-[#35123F]"
                  />
                </div>
              </div>
            </div>

            {/* Compact Brand Mark */}
            <div className={`p-4 border rounded-xl space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <label className={`block text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                  Compact Brand Mark (App Icon)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Square / Icon</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={cmsApp.sidebarCompactLogoUrl || ''}
                  onChange={(e) => handleUpdateCmsAppearance('sidebarCompactLogoUrl', e.target.value)}
                  placeholder="Paste URL or upload icon"
                  className={`flex-1 px-3 py-2 border rounded text-xs outline-none focus:ring-1 focus:ring-[#35123F] ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerTarget('compact');
                      setShowSidebarMediaPicker(true);
                    }}
                    className={`px-3 py-2 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#35123F]" />
                    <span>Media</span>
                  </button>
                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? '...' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleUploadLogo(e, true)}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {cmsApp.sidebarCompactLogoUrl && (
                <div className={`p-3 border rounded-lg flex items-center justify-between gap-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <img
                      src={cmsApp.sidebarCompactLogoUrl}
                      alt={cmsApp.sidebarCompactLogoAlt || 'Compact Logo'}
                      className="w-8 h-8 object-contain p-0.5 rounded bg-slate-50 border border-slate-200"
                    />
                    <div className="text-[11px]">
                      <span className={`font-semibold block truncate max-w-[180px] ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
                        {cmsApp.sidebarCompactLogoAlt || 'Compact Brand Icon'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">32px × 32px</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateCmsAppearance('sidebarCompactLogoUrl', '')}
                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                    title="Remove Compact Logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Sidebar Header Live Preview Specimen */}
              <div className={`pt-2 border-t space-y-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Sidebar Header Specimen Preview:
                </span>
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    cmsApp.mode === 'light'
                      ? 'bg-white border-slate-200 text-slate-900'
                      : 'bg-[#131624] border-slate-800 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cmsApp.sidebarLogoUrl ? (
                      <img
                        src={cmsApp.sidebarLogoUrl}
                        alt="Preview"
                        style={{
                          maxHeight: `${cmsApp.sidebarLogoHeight || 36}px`,
                          maxWidth: `${cmsApp.sidebarLogoWidth || 120}px`,
                        }}
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#35123F] to-[#171B2C] border border-[#D5A13C]/40 flex items-center justify-center text-white text-xs font-bold">
                        AZ
                      </div>
                    )}
                    <span className="text-xs font-bold truncate">
                      {cmsApp.cmsName?.trim() || `${header?.brandName || 'Company'} CMS`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60">
                    {cmsApp.mode === 'light' ? 'Light Theme' : 'Dark Theme'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showSidebarMediaPicker}
        onClose={() => setShowSidebarMediaPicker(false)}
        onSelect={(item) => {
          if (mediaPickerTarget === 'compact') {
            handleUpdateCmsAppearance('sidebarCompactLogoUrl', item.url);
          } else {
            handleUpdateCmsAppearance('sidebarLogoUrl', item.url);
          }
          setShowSidebarMediaPicker(false);
        }}
      />
    </div>
  );
};
