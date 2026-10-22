import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Upload,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Check,
  Image as ImageIcon,
  Menu,
} from 'lucide-react';
import type { NavLink, CmsAppearanceConfig } from '../../types';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { DEFAULT_SETTINGS } from '../../constants/defaultSettings';
import { uploadAdminMedia } from '../../utils/mediaUpload';

export const BrandingManager: React.FC = () => {
  const {
    editorSettings,
    updateDraftSettings,
    publishSettings,
    isSaving,
  } = useTheme();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [uploadingSidebarLogo, setUploadingSidebarLogo] = useState(false);
  const [showSidebarMediaPicker, setShowSidebarMediaPicker] = useState(false);

  const cfg = editorSettings?.header || DEFAULT_SETTINGS.header;
  const cmsApp: CmsAppearanceConfig = (editorSettings?.cmsAppearance || DEFAULT_SETTINGS.cmsAppearance || {
    mode: 'dark',
    sidebarBg: '#171B2C',
    sidebarText: '#94A3B8',
    sidebarActiveBg: '#35123F',
    sidebarActiveText: '#FFFFFF',
    accentColor: '#D5A13C',
    topbarBg: '#131624',
    primaryBrand: '#35123F',
    syncWithWebsiteTheme: false,
    sidebarLogoUrl: '',
    sidebarLogoAlt: 'Company Logo',
    sidebarLogoWidth: 120,
    sidebarLogoHeight: 36,
    sidebarCompactLogoUrl: '',
    sidebarCompactLogoAlt: 'Compact Logo',
  }) as CmsAppearanceConfig;


  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await uploadAdminMedia(file);
      if (result.ok) {
        handleUpdate('logoUrl', result.media.url);
        setFeedback('Header logo uploaded successfully');
      } else {
        setFeedback(result.error);
      }
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleUploadSidebarLogo = async (e: React.ChangeEvent<HTMLInputElement>, compact = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSidebarLogo(true);
    try {
      const result = await uploadAdminMedia(file);
      if (result.ok) {
        const field = compact ? 'sidebarCompactLogoUrl' : 'sidebarLogoUrl';
        handleUpdateCmsAppearance(field, result.media.url);
        setFeedback(compact ? 'Sidebar compact logo uploaded successfully' : 'Sidebar logo uploaded successfully');
      } else {
        setFeedback(result.error);
      }
    } finally {
      setUploadingSidebarLogo(false);
      e.target.value = '';
    }
  };

  const handleUpdate = async (field: string, value: any) => {
    const updated = {
      ...cfg,
      [field]: value,
    };
    await updateDraftSettings({ header: updated });
    setFeedback('Draft updated');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleUpdateCmsAppearance = async (field: keyof CmsAppearanceConfig, value: any) => {
    const updated: CmsAppearanceConfig = {
      ...cmsApp,
      [field]: value,
    };
    await updateDraftSettings({ cmsAppearance: updated });
    setFeedback('Draft updated');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleAddLink = () => {
    const newLink: NavLink = {
      id: 'nav-' + Date.now(),
      label: 'New Link',
      url: '/#',
      order: (cfg.links || []).length + 1,
    };
    handleUpdate('links', [...(cfg.links || []), newLink]);
  };

  const handleUpdateLink = (id: string, updates: Partial<NavLink>) => {
    const links = (cfg.links || []).map((l) => (l.id === id ? { ...l, ...updates } : l));
    handleUpdate('links', links);
  };

  const handleDeleteLink = (id: string) => {
    const links = (cfg.links || []).filter((l) => l.id !== id);
    handleUpdate('links', links);
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const links = [...(cfg.links || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= links.length) return;

    const temp = links[index];
    links[index] = links[targetIdx];
    links[targetIdx] = temp;

    // re-assign order
    links.forEach((l, i) => {
      l.order = i + 1;
    });

    handleUpdate('links', links);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Branding & Header Manager</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure header logo, brand name, logo size, layout presets, and navigation links.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {feedback && (
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {feedback}
            </span>
          )}
          <button
            onClick={async () => {
              const ok = await publishSettings();
              if (ok) {
                setFeedback('Branding published to live website!');
                setTimeout(() => setFeedback(null), 3000);
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Responsive Preview Strip */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Header Preview (Logo + Brand Name Displayed Together)
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded text-xs cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded text-xs cursor-pointer ${
                previewDevice === 'tablet' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded text-xs cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scaled Preview Frame */}
        <div className="cms-public-preview overflow-hidden border border-slate-200 rounded-lg bg-[#FAF7F2] flex justify-center py-4 px-2">
          {(() => {
            const previewLayout = cfg.layoutPreset || 'logo-left-nav-right';
            const previewLinks = (cfg.links || []).slice().sort((a, b) => a.order - b.order);
            const previewMidPoint = Math.ceil(previewLinks.length / 2);
            const previewLeftLinks = previewLinks.slice(0, previewMidPoint);
            const previewRightLinks = previewLinks.slice(previewMidPoint);

            const previewBrandBlock = (
              <div
                className="flex items-center shrink-0 min-w-0"
                style={{ gap: `${cfg.logoSpacing !== undefined ? cfg.logoSpacing : 10}px` }}
              >
                {cfg.logoUrl ? (
                  <img
                    src={cfg.logoUrl}
                    alt={cfg.logoAlt || cfg.brandName}
                    style={{
                      maxHeight: `${cfg.logoHeight || 38}px`,
                      maxWidth: `${Math.min(cfg.logoWidth || 140, 180)}px`,
                      width: 'auto',
                      height: 'auto',
                    }}
                    className="object-contain shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#35123F] to-[#171B2C] border border-[#D5A13C]/40 flex items-center justify-center text-white shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#D5A13C" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="2" fill="#D5A13C" />
                    </svg>
                  </div>
                )}
                {((cfg.brandName ?? 'Azaroth') || cfg.brandSubName) && (
                  <div
                    className={`flex ${
                      (cfg.brandLayout || 'inline') === 'stacked'
                        ? 'flex-col items-start justify-center leading-tight'
                        : 'flex-row items-baseline gap-1.5'
                    } min-w-0`}
                  >
                    {(cfg.brandName ?? 'Azaroth') && (
                      <span
                        className="font-bold tracking-tight truncate"
                        style={{
                          fontSize: cfg.brandNameFontSize ? `${cfg.brandNameFontSize}px` : '0.875rem',
                          color: cfg.brandNameColor || '#35123F',
                        }}
                      >
                        {cfg.brandName ?? 'Azaroth'}
                      </span>
                    )}
                    {cfg.brandSubName && (
                      <span
                        className={`font-semibold tracking-normal truncate ${
                          (cfg.brandLayout || 'inline') === 'stacked' ? 'mt-0.5' : ''
                        }`}
                        style={{
                          fontSize: cfg.brandSubNameFontSize
                            ? `${cfg.brandSubNameFontSize}px`
                            : (cfg.brandLayout || 'inline') === 'stacked'
                            ? '0.65rem'
                            : '0.75rem',
                          color: cfg.brandSubNameColor || '#D5A13C',
                        }}
                      >
                        {cfg.brandSubName}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );

            const previewCtaBlock = (
              <div>
                <span
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded whitespace-nowrap"
                  style={{
                    backgroundColor:
                      cfg.ctaStyle === 'gold'
                        ? '#D5A13C'
                        : cfg.ctaStyle === 'outline'
                        ? 'transparent'
                        : '#35123F',
                    color: cfg.ctaStyle === 'outline' ? '#35123F' : '#FFFFFF',
                    border: cfg.ctaStyle === 'outline' ? '1px solid #35123F' : 'none',
                  }}
                >
                  {cfg.ctaText || 'Consultation'}
                </span>
              </div>
            );

            return (
              <div
                className="transition-all duration-300 w-full rounded border border-slate-200 shadow-xs px-4 py-3 flex items-center"
                style={{
                  maxWidth:
                    previewDevice === 'mobile' ? '380px' : previewDevice === 'tablet' ? '640px' : '100%',
                  backgroundColor: cfg.backgroundColor || '#FAF7F2',
                }}
              >
                {previewDevice === 'mobile' ? (
                  <div className="w-full flex items-center justify-between">
                    {previewBrandBlock}
                    <div className="p-1 border border-slate-300 rounded text-slate-700">
                      <Menu className="w-4 h-4" />
                    </div>
                  </div>
                ) : previewLayout === 'logo-center-split' ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    {/* Left side links */}
                    <div className="flex-1 flex items-center gap-4 text-xs font-medium justify-start" style={{ color: cfg.textColor || '#35123F' }}>
                      {previewLeftLinks.map((l) => (
                        <span key={l.id} className="whitespace-nowrap">{l.label}</span>
                      ))}
                    </div>
                    {/* Center brand block */}
                    <div className="shrink-0 flex justify-center px-2">
                      {previewBrandBlock}
                    </div>
                    {/* Right side links + CTA */}
                    <div className="flex-1 flex items-center gap-4 justify-end">
                      <div className="flex items-center gap-4 text-xs font-medium" style={{ color: cfg.textColor || '#35123F' }}>
                        {previewRightLinks.map((l) => (
                          <span key={l.id} className="whitespace-nowrap">{l.label}</span>
                        ))}
                      </div>
                      {previewCtaBlock}
                    </div>
                  </div>
                ) : previewLayout === 'logo-left-nav-center' ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    {/* Left: Brand */}
                    <div className="flex-1 flex items-center justify-start min-w-0">
                      {previewBrandBlock}
                    </div>
                    {/* Center: Nav links */}
                    <div className="shrink-0 flex items-center justify-center gap-4 text-xs font-medium" style={{ color: cfg.textColor || '#35123F' }}>
                      {previewLinks.map((l) => (
                        <span key={l.id} className="whitespace-nowrap">{l.label}</span>
                      ))}
                    </div>
                    {/* Right: CTA */}
                    <div className="flex-1 flex items-center justify-end">
                      {previewCtaBlock}
                    </div>
                  </div>
                ) : previewLayout === 'logo-right-nav-center' ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    {/* Left: CTA */}
                    <div className="flex-1 flex items-center justify-start">
                      {previewCtaBlock}
                    </div>
                    {/* Center: Nav links */}
                    <div className="shrink-0 flex items-center justify-center gap-4 text-xs font-medium" style={{ color: cfg.textColor || '#35123F' }}>
                      {previewLinks.map((l) => (
                        <span key={l.id} className="whitespace-nowrap">{l.label}</span>
                      ))}
                    </div>
                    {/* Right: Brand */}
                    <div className="flex-1 flex items-center justify-end min-w-0">
                      {previewBrandBlock}
                    </div>
                  </div>
                ) : previewLayout === 'logo-right-nav-left' ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    {/* Left: CTA followed by Nav */}
                    <div className="flex items-center gap-4">
                      {previewCtaBlock}
                      <div className="flex items-center gap-4 text-xs font-medium" style={{ color: cfg.textColor || '#35123F' }}>
                        {previewLinks.map((l) => (
                          <span key={l.id} className="whitespace-nowrap">{l.label}</span>
                        ))}
                      </div>
                    </div>
                    {/* Right: Brand */}
                    <div className="flex items-center justify-end ml-auto">
                      {previewBrandBlock}
                    </div>
                  </div>
                ) : (
                  /* Layout 3: logo-left-nav-right */
                  <div className="w-full flex items-center justify-between gap-3">
                    {previewBrandBlock}
                    <div className="flex items-center gap-4 ml-auto">
                      <div className="flex items-center gap-4 text-xs font-medium" style={{ color: cfg.textColor || '#35123F' }}>
                        {previewLinks.map((l) => (
                          <span key={l.id} className="whitespace-nowrap">{l.label}</span>
                        ))}
                      </div>
                      {previewCtaBlock}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Brand Identity Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Brand Identity & Logo</h3>

          {/* Main Brand Name & Sub-name inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Main Brand Name *
              </label>
              <input
                type="text"
                aria-label="Main brand name"
                value={cfg.brandName || ''}
                onChange={(e) => handleUpdate('brandName', e.target.value)}
                placeholder="Brand Name"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand Sub-name (Suffix)
              </label>
              <input
                type="text"
                value={cfg.brandSubName ?? ''}
                onChange={(e) => handleUpdate('brandSubName', e.target.value)}
                placeholder="Suffix"
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
              />
            </div>
          </div>

          {/* Layout Options: Inline vs Stacked */}
          <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50">
            <label className="block text-xs font-semibold text-slate-700">
              Brand Display Layout
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdate('brandLayout', 'inline')}
                className={`px-3 py-2 rounded text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  (cfg.brandLayout || 'inline') === 'inline'
                    ? 'bg-[#35123F] text-white border-[#35123F]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Inline (Same Line)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUpdate('brandLayout', 'stacked')}
                className={`px-3 py-2 rounded text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  cfg.brandLayout === 'stacked'
                    ? 'bg-[#35123F] text-white border-[#35123F]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Stacked (Above & Below)</span>
              </button>
            </div>
          </div>

          {/* Independent Font Size Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Brand Name Font Size</label>
                <span className="text-[11px] font-mono text-slate-500">{cfg.brandNameFontSize || 18}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="36"
                value={cfg.brandNameFontSize || 18}
                onChange={(e) => handleUpdate('brandNameFontSize', parseInt(e.target.value, 10))}
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Sub-name Font Size</label>
                <span className="text-[11px] font-mono text-slate-500">{cfg.brandSubNameFontSize || 14}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="28"
                value={cfg.brandSubNameFontSize || 14}
                onChange={(e) => handleUpdate('brandSubNameFontSize', parseInt(e.target.value, 10))}
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>
          </div>

          {/* Independent Color Pickers for Brand Name and Sub-name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">Brand Name Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cfg.brandNameColor || '#35123F'}
                  onChange={(e) => handleUpdate('brandNameColor', e.target.value)}
                  className="w-8 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={cfg.brandNameColor || '#35123F'}
                  onChange={(e) => handleUpdate('brandNameColor', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white outline-none uppercase"
                />
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <label className="block text-[11px] font-semibold text-slate-700">Sub-name Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cfg.brandSubNameColor || '#D5A13C'}
                  onChange={(e) => handleUpdate('brandSubNameColor', e.target.value)}
                  className="w-8 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                />
                <input
                  type="text"
                  value={cfg.brandSubNameColor || '#D5A13C'}
                  onChange={(e) => handleUpdate('brandSubNameColor', e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono border border-slate-300 rounded bg-white outline-none uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Subtitle / Regional Trust Tagline
            </label>
            <input
              type="text"
              value={cfg.subtitle || ''}
              onChange={(e) => handleUpdate('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              Brand Header Logo (URL, PNG/SVG Upload, or Media Library)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cfg.logoUrl}
                onChange={(e) => handleUpdate('logoUrl', e.target.value)}
                placeholder="Enter image URL or choose from library"
                className="flex-1 px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#35123F]" />
                  <span>Choose from Media</span>
                </button>
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleUploadLogo}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {cfg.logoUrl && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={cfg.logoUrl}
                    alt="Logo Preview"
                    style={{ height: '28px', maxWidth: `${cfg.logoWidth}px` }}
                    className="object-contain bg-white/60 p-0.5 rounded border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[11px] text-slate-600 font-mono truncate max-w-xs">{cfg.logoUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdate('logoUrl', '')}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Remove Logo
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Logo Width</label>
                <span className="text-[11px] font-mono text-slate-500">{cfg.logoWidth || 140}px</span>
              </div>
              <input
                type="range"
                min="40"
                max="240"
                value={cfg.logoWidth || 140}
                onChange={(e) => handleUpdate('logoWidth', parseInt(e.target.value, 10))}
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Logo Height</label>
                <span className="text-[11px] font-mono text-slate-500">{cfg.logoHeight || 42}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="64"
                value={cfg.logoHeight || 42}
                onChange={(e) => handleUpdate('logoHeight', parseInt(e.target.value, 10))}
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Logo Gap</label>
                <span className="text-[11px] font-mono text-slate-500">{cfg.logoSpacing !== undefined ? cfg.logoSpacing : 10}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="32"
                value={cfg.logoSpacing !== undefined ? cfg.logoSpacing : 10}
                onChange={(e) => handleUpdate('logoSpacing', parseInt(e.target.value, 10))}
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Logo Alt Description
            </label>
            <input
              type="text"
              value={cfg.logoAlt}
              onChange={(e) => handleUpdate('logoAlt', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
            />
          </div>
        </div>

        {/* CMS Sidebar Logo Card (white-label branding) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">CMS Sidebar Logo</h3>
          <p className="text-xs text-slate-500">
            Configure the company logo shown in the CMS admin sidebar (expanded and collapsed modes).
          </p>

          {/* Sidebar Logo Upload & Media Library */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              CMS Sidebar Logo (Expanded Mode)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cmsApp.sidebarLogoUrl || ''}
                onChange={(e) => handleUpdateCmsAppearance('sidebarLogoUrl', e.target.value)}
                placeholder="Enter image URL or choose from library"
                className="flex-1 px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSidebarMediaPicker(true)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#35123F]" />
                  <span>Choose from Media</span>
                </button>
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingSidebarLogo ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => handleUploadSidebarLogo(e, false)}
                    disabled={uploadingSidebarLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {cmsApp.sidebarLogoUrl && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={cmsApp.sidebarLogoUrl}
                    alt={cmsApp.sidebarLogoAlt || 'Sidebar Logo Preview'}
                    style={{
                      height: '28px',
                      maxWidth: `${cmsApp.sidebarLogoWidth || 120}px`,
                    }}
                    className="object-contain bg-white/60 p-0.5 rounded border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[11px] text-slate-600 font-mono truncate max-w-xs">{cmsApp.sidebarLogoUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateCmsAppearance('sidebarLogoUrl', '')}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Remove Logo
                </button>
              </div>
            )}
          </div>

          {/* Compact Logo (Collapsed Sidebar) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              Compact Sidebar Logo (Collapsed Mode)
            </label>
            <p className="text-[10px] text-slate-400">
              Optional brand mark shown when the sidebar is collapsed. Leave empty to use the platform brand mark.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={cmsApp.sidebarCompactLogoUrl || ''}
                onChange={(e) => handleUpdateCmsAppearance('sidebarCompactLogoUrl', e.target.value)}
                placeholder="Enter compact logo image URL"
                className="flex-1 px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingSidebarLogo ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => handleUploadSidebarLogo(e, true)}
                    disabled={uploadingSidebarLogo}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            {cmsApp.sidebarCompactLogoUrl && (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={cmsApp.sidebarCompactLogoUrl}
                    alt={cmsApp.sidebarCompactLogoAlt || 'Compact Logo Preview'}
                    style={{
                      height: '28px',
                      maxWidth: '64px',
                    }}
                    className="object-contain bg-white/60 p-0.5 rounded border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[11px] text-slate-600 font-mono truncate max-w-xs">{cmsApp.sidebarCompactLogoUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateCmsAppearance('sidebarCompactLogoUrl', '')}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Remove Compact Logo
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Logo Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Sidebar Logo Width</label>
                <span className="text-[11px] font-mono text-slate-500">
                  {cmsApp.sidebarLogoWidth || 120}px
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="240"
                value={cmsApp.sidebarLogoWidth || 120}
                onChange={(e) =>
                  handleUpdateCmsAppearance('sidebarLogoWidth', parseInt(e.target.value, 10))
                }
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600">Sidebar Logo Max Height</label>
                <span className="text-[11px] font-mono text-slate-500">
                  {cmsApp.sidebarLogoHeight || 36}px
                </span>
              </div>
              <input
                type="range"
                min="24"
                max="64"
                value={cmsApp.sidebarLogoHeight || 36}
                onChange={(e) =>
                  handleUpdateCmsAppearance('sidebarLogoHeight', parseInt(e.target.value, 10))
                }
                className="w-full accent-[#35123F] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Sidebar Logo Alt Description
            </label>
            <input
              type="text"
              value={cmsApp.sidebarLogoAlt || ''}
              onChange={(e) => handleUpdateCmsAppearance('sidebarLogoAlt', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
            />
          </div>
        </div>

        {/* Header Behavior & Layout Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Header Layout & Behavior</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Layout Arrangement
            </label>
            <select
              value={cfg.layoutPreset || 'logo-left-nav-right'}
              onChange={(e) => handleUpdate('layoutPreset', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none bg-white font-medium"
            >
              <option value="logo-left-nav-center">Layout 1: Logo Left, Navigation Center, CTA Right</option>
              <option value="logo-right-nav-center">Layout 2: Logo Right, Navigation Center, CTA Left</option>
              <option value="logo-left-nav-right">Layout 3: Logo Left, Navigation and CTA Right (Standard)</option>
              <option value="logo-right-nav-left">Layout 4: Logo Right, CTA and Navigation Left</option>
              <option value="logo-center-split">Split Layout: Logo Centered, Split Navigation</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Header Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cfg.backgroundColor}
                  onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={cfg.backgroundColor}
                  onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Header Text Ink (Navigation & Text, including hero overlay)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cfg.textColor || '#35123F'}
                  onChange={(e) => handleUpdate('textColor', e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={cfg.textColor || '#35123F'}
                  onChange={(e) => handleUpdate('textColor', e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div>
              <label htmlFor="header-overlay-background-color" className="mb-1 block text-xs font-semibold text-slate-700">
                Overlay Navbar Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="header-overlay-background-color"
                  type="color"
                  value={cfg.overlayBackgroundColor || '#171B2C'}
                  onChange={(e) => handleUpdate('overlayBackgroundColor', e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-slate-300"
                  aria-label="Overlay navbar background color"
                />
                <input
                  type="text"
                  value={cfg.overlayBackgroundColor || '#171B2C'}
                  onChange={(e) => handleUpdate('overlayBackgroundColor', e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs"
                  aria-label="Overlay navbar background color value"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="header-overlay-transparency" className="text-xs font-semibold text-slate-700">
                Navbar Transparency in Overlay Mode
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {cfg.overlayTransparency ?? 0}%
              </span>
            </div>
            <input
              id="header-overlay-transparency"
              type="range"
              min="0"
              max="100"
              step="5"
              value={cfg.overlayTransparency ?? 0}
              onChange={(e) => handleUpdate('overlayTransparency', Number(e.target.value))}
              className="w-full cursor-pointer accent-[#35123F]"
              aria-describedby="header-overlay-transparency-help"
            />
            <p id="header-overlay-transparency-help" className="text-[11px] text-slate-500">
              Adjusts the header background transparency over the hero area. When the overlay header is enabled below, this treatment is applied consistently to every public page. The header background color above stays unchanged.
            </p>
            <div className="flex items-center justify-between gap-3 pt-1">
              <label htmlFor="header-navbar-transparency-scroll" className="text-xs font-semibold text-slate-700">
                Navbar Transparency on Scroll
              </label>
              <span className="font-mono text-[11px] text-slate-500">
                {cfg.navbarTransparencyOnScroll ?? 0}%
              </span>
            </div>
            <input
              id="header-navbar-transparency-scroll"
              type="range"
              min="0"
              max="100"
              step="5"
              value={cfg.navbarTransparencyOnScroll ?? 0}
              onChange={(e) => handleUpdate('navbarTransparencyOnScroll', Number(e.target.value))}
              className="w-full cursor-pointer accent-[#35123F]"
              aria-describedby="header-navbar-transparency-scroll-help"
            />
            <p id="header-navbar-transparency-scroll-help" className="text-[11px] text-slate-500">
              Transparency applied to the overlay navbar once the visitor scrolls. Use 0-10% for a more opaque, readable navbar. Independent from the banner image and gradient opacity.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.isSticky}
                onChange={(e) => handleUpdate('isSticky', e.target.checked)}
                className="rounded text-[#35123F] focus:ring-[#35123F]"
              />
              <span>Enable Sticky Top Bar on Scroll</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={cfg.isTransparentOnHero}
                onChange={(e) => handleUpdate('isTransparentOnHero', e.target.checked)}
                className="rounded text-[#35123F] focus:ring-[#35123F]"
              />
              <span>Apply Overlay Header Style to All Pages (Top of page)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Header CTA Button Manager */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Primary Header CTA</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              CTA Button Label
            </label>
            <input
              type="text"
              value={cfg.ctaText}
              onChange={(e) => handleUpdate('ctaText', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Target Link / Anchor
            </label>
            <input
              type="text"
              value={cfg.ctaUrl}
              onChange={(e) => handleUpdate('ctaUrl', e.target.value)}
              placeholder="e.g. #contact or /products"
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Color Style
            </label>
            <select
              value={cfg.ctaStyle}
              onChange={(e) => handleUpdate('ctaStyle', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none bg-white"
            >
              <option value="burgundy">Primary Burgundy Fill (#35123F)</option>
              <option value="gold">Metallic Gold Fill (#D5A13C)</option>
              <option value="outline">Burgundy Outline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Links Manager */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Navigation Links</h3>
            <p className="text-xs text-slate-500">
              Manage order, labels, and routes in the top navigation bar.
            </p>
          </div>
          <button
            onClick={handleAddLink}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Nav Link</span>
          </button>
        </div>

        <div className="space-y-2">
          {(cfg.links || []).map((link, idx) => (
            <div
              key={link.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <span className="text-xs font-mono text-slate-400 w-6 text-center">
                #{idx + 1}
              </span>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={link.label}
                  onChange={(e) => handleUpdateLink(link.id, { label: e.target.value })}
                  placeholder="Link Label"
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                  placeholder="URL Destination"
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveLink(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleMoveLink(idx, 'down')}
                  disabled={idx === (cfg.links || []).length - 1}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                  title="Delete Link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(item) => handleUpdate('logoUrl', typeof item === 'string' ? item : item.url)}
        title="Select Header Brand Logo"
      />

      <MediaPickerModal
        isOpen={showSidebarMediaPicker}
        onClose={() => setShowSidebarMediaPicker(false)}
        onSelect={(item) => handleUpdateCmsAppearance('sidebarLogoUrl', typeof item === 'string' ? item : item.url)}
        title="Select CMS Sidebar Logo"
      />
    </div>
  );
};
