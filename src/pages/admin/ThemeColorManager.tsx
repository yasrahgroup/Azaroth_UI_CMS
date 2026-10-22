import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { SettingsActionBar } from '../../components/admin/SettingsActionBar';
import {
  Palette,
  Check,
  Sparkles,
  Sliders,
  Moon,
  Sun,
  ExternalLink,
  Wand2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ColorDistributionPreset, ColorStyle, PublicDarkThemeColors } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants/defaultSettings';

export const ThemeColorManager: React.FC = () => {
  const {
    editorSettings,
    updateDraftSettings,
    cmsMode,
  } = useTheme();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeSpecimenMode, setActiveSpecimenMode] = useState<'light' | 'dark'>('light');

  const theme = editorSettings?.theme || DEFAULT_SETTINGS.theme;
  const isLight = cmsMode === 'light';


  const darkTheme: PublicDarkThemeColors = theme.darkTheme || {
    background: '#0F172A',
    surface: '#1E293B',
    headingInk: '#F8FAFC',
    bodyText: '#CBD5E1',
    mutedText: '#94A3B8',
    borderColor: '#334155',
    headerBg: '#0F172A',
    footerBg: '#0A0F1D',
    buttonBg: theme.buttonBg || theme.primary,
    buttonText: theme.buttonText || '#FFFFFF',
  };

  const handleUpdate = async (field: string, value: any) => {
    const updated = {
      ...theme,
      [field]: value,
    };
    await updateDraftSettings({ theme: updated });
    setFeedback('Theme updated in draft');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleUpdateDarkTheme = async (field: keyof PublicDarkThemeColors, value: string) => {
    const updatedDark = {
      ...darkTheme,
      [field]: value,
    };
    const updatedTheme = {
      ...theme,
      darkTheme: updatedDark,
    };
    await updateDraftSettings({ theme: updatedTheme });
    setFeedback('Public dark theme updated in draft');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleApplyPreset = async (preset: ColorDistributionPreset) => {
    let presetTokens = { ...theme, distributionPreset: preset };

    switch (preset) {
      case 'plum-gold-luxury':
        presetTokens = {
          ...presetTokens,
          primary: '#35123F', secondary: '#D5A13C', accent: '#A855F7',
          background: '#FAF7F2', surface: '#FFFFFF',
          headingInk: '#24102D', bodyText: '#62576A', mutedText: '#62576A',
          linkText: '#35123F', buttonBg: '#35123F', buttonText: '#FFF9F1',
          borderColor: '#E7D9CC', headerBg: '#FAF7F2', footerBg: '#24102D',
          gradientStart: '#A855F7', gradientEnd: '#F4A7A3', gradientAngle: 135,
          colorStyle: 'gradient',
        };
        break;
      case 'burgundy-primary':
        presetTokens = {
          ...presetTokens,
          primary: '#35123F',
          accent: '#D5A13C',
          background: '#FAF7F2',
          surface: '#FFFFFF',
          headingInk: '#171B2C',
          bodyText: '#334155',
          buttonBg: '#35123F',
          buttonText: '#FFFFFF',
          headerBg: '#FAF7F2',
          footerBg: '#171B2C',
        };
        break;
      case 'ivory-primary':
        presetTokens = {
          ...presetTokens,
          primary: '#24102D',
          accent: '#C4902F',
          background: '#FFFFFF',
          surface: '#FAF7F2',
          headingInk: '#171B2C',
          bodyText: '#1E293B',
          buttonBg: '#24102D',
          buttonText: '#FFFFFF',
          headerBg: '#FFFFFF',
          footerBg: '#1E293B',
        };
        break;
      case 'balanced-burgundy-ivory':
        presetTokens = {
          ...presetTokens,
          primary: '#35123F',
          accent: '#D5A13C',
          background: '#FDFBF7',
          surface: '#FFFFFF',
          headingInk: '#0F172A',
          bodyText: '#334155',
          buttonBg: '#35123F',
          buttonText: '#FFFFFF',
          headerBg: '#FDFBF7',
          footerBg: '#0F172A',
        };
        break;
      case 'gold-accented':
        presetTokens = {
          ...presetTokens,
          primary: '#35123F',
          accent: '#E5B14C',
          background: '#FAF7F2',
          surface: '#FFFFFF',
          headingInk: '#171B2C',
          bodyText: '#334155',
          buttonBg: '#D5A13C',
          buttonText: '#171B2C',
          headerBg: '#FAF7F2',
          footerBg: '#171B2C',
        };
        break;
      case 'monochrome-accented':
        presetTokens = {
          ...presetTokens,
          primary: '#171B2C',
          accent: '#35123F',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          headingInk: '#0F172A',
          bodyText: '#334155',
          buttonBg: '#171B2C',
          buttonText: '#FFFFFF',
          headerBg: '#F8FAFC',
          footerBg: '#0F172A',
        };
        break;
    }

    await updateDraftSettings({ theme: presetTokens });
    setFeedback(`Applied ${preset} palette`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleApplyDarkPreset = async (type: 'midnight' | 'charcoal' | 'obsidian' | 'burgundy-night') => {
    let preset: PublicDarkThemeColors = { ...darkTheme };
    if (type === 'midnight') {
      preset = {
        background: '#0B0F19',
        surface: '#111827',
        headingInk: '#F9FAFB',
        bodyText: '#E5E7EB',
        mutedText: '#9CA3AF',
        borderColor: '#1F2937',
        headerBg: '#0B0F19',
        footerBg: '#080C14',
        buttonBg: theme.primary,
        buttonText: '#FFFFFF',
      };
    } else if (type === 'charcoal') {
      preset = {
        background: '#121212',
        surface: '#1E1E1E',
        headingInk: '#FFFFFF',
        bodyText: '#E0E0E0',
        mutedText: '#A0A0A0',
        borderColor: '#2D2D2D',
        headerBg: '#121212',
        footerBg: '#0A0A0A',
        buttonBg: theme.primary,
        buttonText: '#FFFFFF',
      };
    } else if (type === 'obsidian') {
      preset = {
        background: '#090D16',
        surface: '#131B2E',
        headingInk: '#F8FAFC',
        bodyText: '#CBD5E1',
        mutedText: '#64748B',
        borderColor: '#1E293B',
        headerBg: '#090D16',
        footerBg: '#060910',
        buttonBg: theme.accent || '#D5A13C',
        buttonText: '#090D16',
      };
    } else if (type === 'burgundy-night') {
      preset = {
        background: '#12070A',
        surface: '#200D13',
        headingInk: '#FFF1F2',
        bodyText: '#FECDD3',
        mutedText: '#FDA4AF',
        borderColor: '#3D131F',
        headerBg: '#12070A',
        footerBg: '#0A0305',
        buttonBg: '#35123F',
        buttonText: '#FFFFFF',
      };
    }

    await updateDraftSettings({
      theme: {
        ...theme,
        darkTheme: preset,
      },
    });
    setFeedback(`Applied ${type} dark palette`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const ColorInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
  }) => (
    <div
      className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#161A2B]'
      }`}
    >
      <div className="flex items-center justify-between">
        <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
          {label}
        </label>
        <span className="text-[10px] font-mono text-slate-400 uppercase">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className={`w-9 h-8 rounded border cursor-pointer p-0.5 shrink-0 ${
            isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-800'
          }`}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={`flex-1 px-2.5 py-1 text-xs font-mono border rounded outline-none focus:border-[#35123F] ${
            isLight ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-700 bg-slate-900 text-slate-200'
          }`}
        />
      </div>
    </div>
  );

  const currentColorStyle = theme.colorStyle || 'solid';
  const gradientStart = theme.gradientStart || theme.primary || '#35123F';
  const gradientEnd = theme.gradientEnd || theme.accent || '#D5A13C';
  const gradientAngle = theme.gradientAngle ?? 135;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header & Save/Publish */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Public Website Theme & Colors
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure the customer-facing brand palette, public website dark mode, CTA button styling, and color distribution.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {feedback && (
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded font-medium flex items-center gap-1.5 shadow-2xs">
              <Check className="w-3.5 h-3.5" />
              {feedback}
            </span>
          )}
          <SettingsActionBar
            isLight={isLight}
            onFeedback={(message) => {
              setFeedback(message);
              setTimeout(() => setFeedback(null), 3000);
            }}
            labels={{ publish: 'Save & Publish Live' }}
          />
        </div>
      </div>

      {/* NEW: SECTION 2 & 3: Public Website Dark Mode Configuration */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Public Website Dark Mode Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable an optional visitor light/dark switch on your public website and customize its dark theme tokens.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                theme.enableDarkMode
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
              {theme.enableDarkMode ? 'Dark Mode Enabled on Website' : 'Dark Mode Disabled (Light Only)'}
            </span>

            {/* Master Public Dark Mode Toggle */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme.enableDarkMode ?? false}
                onChange={(e) => handleUpdate('enableDarkMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#35123F]"></div>
            </label>
          </div>
        </div>

        {theme.enableDarkMode ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Template-aware Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Template-Aware Dark Theme Presets
                </label>
                <span className="text-[11px] text-slate-400">Click to apply palette</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'midnight', name: 'Midnight Slate', bg: '#0B0F19', surface: '#111827', text: '#F9FAFB' },
                  { id: 'charcoal', name: 'Deep Charcoal', bg: '#121212', surface: '#1E1E1E', text: '#FFFFFF' },
                  { id: 'obsidian', name: 'Navy Obsidian', bg: '#090D16', surface: '#131B2E', text: '#F8FAFC' },
                  { id: 'burgundy-night', name: 'Burgundy Night', bg: '#12070A', surface: '#200D13', text: '#FFF1F2' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyDarkPreset(p.id as any)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isLight
                        ? 'border-slate-200 hover:border-slate-400 bg-slate-50'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.bg }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: p.surface }} />
                    </div>
                    <span className={`text-xs font-bold block ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Harmonized</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Theme Token Customization Inputs */}
            <div className="space-y-3">
              <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Public Dark Theme Color Tokens
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <ColorInput
                  label="Dark Canvas Background"
                  value={darkTheme.background}
                  onChange={(val) => handleUpdateDarkTheme('background', val)}
                />
                <ColorInput
                  label="Dark Surface & Cards"
                  value={darkTheme.surface}
                  onChange={(val) => handleUpdateDarkTheme('surface', val)}
                />
                <ColorInput
                  label="Dark Heading Ink"
                  value={darkTheme.headingInk}
                  onChange={(val) => handleUpdateDarkTheme('headingInk', val)}
                />
                <ColorInput
                  label="Dark Body Text"
                  value={darkTheme.bodyText}
                  onChange={(val) => handleUpdateDarkTheme('bodyText', val)}
                />
                <ColorInput
                  label="Dark Muted Text"
                  value={darkTheme.mutedText}
                  onChange={(val) => handleUpdateDarkTheme('mutedText', val)}
                />
                <ColorInput
                  label="Dark Hairline Border"
                  value={darkTheme.borderColor}
                  onChange={(val) => handleUpdateDarkTheme('borderColor', val)}
                />
                <ColorInput
                  label="Dark Header Background"
                  value={darkTheme.headerBg}
                  onChange={(val) => handleUpdateDarkTheme('headerBg', val)}
                />
                <ColorInput
                  label="Dark Footer Background"
                  value={darkTheme.footerBg}
                  onChange={(val) => handleUpdateDarkTheme('footerBg', val)}
                />
                <ColorInput
                  label="Dark Button Background"
                  value={darkTheme.buttonBg || theme.primary}
                  onChange={(val) => handleUpdateDarkTheme('buttonBg', val)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/40 border-slate-800 text-slate-400'
            }`}
          >
            <span>
              Public dark mode is currently disabled. Visitors will always view the clean light theme configured below.
            </span>
            <button
              type="button"
              onClick={() => handleUpdate('enableDarkMode', true)}
              className="px-3 py-1 bg-[#35123F] text-white rounded text-xs font-semibold cursor-pointer"
            >
              Enable Dark Mode
            </button>
          </div>
        )}
      </div>

      {/* Color Style & CTA Configuration */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#35123F]" />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Flagship CTA & Button Color Style
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-semibold">
            Active: {currentColorStyle}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Button Fill Style
            </label>
            <select
              value={currentColorStyle}
              onChange={(e) => handleUpdate('colorStyle', e.target.value as ColorStyle)}
              className={`w-full px-3 py-2 border rounded-lg text-xs font-medium outline-none focus:border-[#35123F] ${
                isLight ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-700 bg-slate-900 text-slate-200'
              }`}
            >
              <option value="solid">Solid Brand Color</option>
              <option value="gradient">Linear Gradient</option>
              <option value="outline">Outlined Border</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className={`block text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Quick Fill Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  updateDraftSettings({
                    theme: { ...theme, colorStyle: 'solid', buttonBg: theme.primary, buttonText: '#FFFFFF' },
                  })
                }
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentColorStyle === 'solid' && theme.buttonBg === theme.primary
                    ? 'border-[#35123F] ring-2 ring-[#35123F]/20 text-[#35123F]'
                    : isLight
                    ? 'border-slate-200 text-slate-700'
                    : 'border-slate-700 text-slate-300'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: theme.primary }} />
                <span>Primary</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateDraftSettings({
                    theme: { ...theme, colorStyle: 'solid', buttonBg: theme.accent, buttonText: '#171B2C' },
                  })
                }
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentColorStyle === 'solid' && theme.buttonBg === theme.accent
                    ? 'border-[#D5A13C] ring-2 ring-[#D5A13C]/20 text-amber-500'
                    : isLight
                    ? 'border-slate-200 text-slate-700'
                    : 'border-slate-700 text-slate-300'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shadow-2xs" style={{ backgroundColor: theme.accent }} />
                <span>Accent</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  updateDraftSettings({
                    theme: { ...theme, colorStyle: 'outline' },
                  })
                }
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentColorStyle === 'outline'
                    ? 'border-[#35123F] ring-2 ring-[#35123F]/20 text-[#35123F]'
                    : isLight
                    ? 'border-slate-200 text-slate-700'
                    : 'border-slate-700 text-slate-300'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full border-2 border-[#35123F] bg-transparent" />
                <span>Outline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gradient Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#D5A13C]" />
            <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Gradient Controls
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ColorInput
              label="Gradient Start Color"
              value={gradientStart}
              onChange={(val) => handleUpdate('gradientStart', val)}
            />
            <ColorInput
              label="Gradient End Color"
              value={gradientEnd}
              onChange={(val) => handleUpdate('gradientEnd', val)}
            />
            <div
              className={`space-y-1.5 p-3 rounded-lg border flex flex-col justify-between ${
                isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#161A2B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Gradient Angle
                </label>
                <span className="text-[10px] font-mono text-slate-400">{gradientAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={gradientAngle}
                onChange={(e) => handleUpdate('gradientAngle', parseInt(e.target.value, 10))}
                className="w-full accent-[#35123F] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>0°</span>
                <span>90°</span>
                <span>135°</span>
                <span>180°</span>
                <span>360°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Light Theme Tokens */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-6 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Public Light Theme Tokens
            </h3>
          </div>
          <span className="text-xs text-slate-400">Default Website Theme</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <ColorInput label="Primary Brand Burgundy" value={theme.primary} onChange={(v) => handleUpdate('primary', v)} />
          <ColorInput label="Metallic Gold Accent" value={theme.accent} onChange={(v) => handleUpdate('accent', v)} />
          <ColorInput label="Secondary Dark" value={theme.secondary} onChange={(v) => handleUpdate('secondary', v)} />
          <ColorInput label="Canvas Background (Ivory)" value={theme.background} onChange={(v) => handleUpdate('background', v)} />
          <ColorInput label="Surface & Card Background" value={theme.surface} onChange={(v) => handleUpdate('surface', v)} />
          <ColorInput label="Heading Ink" value={theme.headingInk} onChange={(v) => handleUpdate('headingInk', v)} />
          <ColorInput label="Body Text Ink" value={theme.bodyText} onChange={(v) => handleUpdate('bodyText', v)} />
          <ColorInput label="Muted Metadata Text" value={theme.mutedText} onChange={(v) => handleUpdate('mutedText', v)} />
          <ColorInput label="Hairline Border Color" value={theme.borderColor} onChange={(v) => handleUpdate('borderColor', v)} />
          <ColorInput label="CTA Button Background" value={theme.buttonBg} onChange={(v) => handleUpdate('buttonBg', v)} />
          <ColorInput label="CTA Button Text" value={theme.buttonText} onChange={(v) => handleUpdate('buttonText', v)} />
          <ColorInput label="Header Background" value={theme.headerBg} onChange={(v) => handleUpdate('headerBg', v)} />
        </div>
      </div>

      {/* Distribution Presets */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D5A13C]" />
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Approved Brand Palette Presets
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { id: 'plum-gold-luxury', label: 'Plum & Gold Luxury', color: '#35123F' },
            { id: 'burgundy-primary', label: 'Deep Plum Primary', color: '#35123F' },
            { id: 'ivory-primary', label: 'Ivory Primary', color: '#FAF7F2' },
            { id: 'balanced-burgundy-ivory', label: 'Balanced Plum & Ivory', color: '#35123F' },
            { id: 'gold-accented', label: 'Gold Accented', color: '#D5A13C' },
            { id: 'monochrome-accented', label: 'Minimal Dark', color: '#171B2C' },
          ].map((preset) => {
            const active = theme.distributionPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id as ColorDistributionPreset)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  active
                    ? 'border-[#35123F] ring-2 ring-[#35123F]/20 bg-slate-50 dark:bg-slate-900'
                    : isLight
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div
                  className="w-full h-4 rounded mb-2 border border-black/10"
                  style={{ backgroundColor: preset.color }}
                />
                <span className={`text-xs font-semibold block truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {preset.label}
                </span>
                <span className="text-[10px] text-slate-400">
                  {active ? 'Active preset' : 'Click to apply'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Specimen Comparison Sandbox */}
      <div
        className={`p-6 rounded-2xl border shadow-xs space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Interactive Public Website Theme Specimen
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare how your public website renders in Light Mode vs Dark Mode.
            </p>
          </div>

          {theme.enableDarkMode && (
            <div className="flex items-center gap-1 p-1 rounded-lg border bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveSpecimenMode('light')}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeSpecimenMode === 'light'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-500" />
                <span>Light Specimen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSpecimenMode('dark')}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer transition-all ${
                  activeSpecimenMode === 'dark'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-400" />
                <span>Dark Specimen</span>
              </button>
            </div>
          )}
        </div>

        {(() => {
          const isDarkSpecimen = activeSpecimenMode === 'dark' && theme.enableDarkMode;
          const bg = isDarkSpecimen ? darkTheme.background : theme.background;
          const surface = isDarkSpecimen ? darkTheme.surface : theme.surface;
          const heading = isDarkSpecimen ? darkTheme.headingInk : theme.headingInk;
          const body = isDarkSpecimen ? darkTheme.bodyText : theme.bodyText;
          const border = isDarkSpecimen ? darkTheme.borderColor : theme.borderColor;
          const btnBg = isDarkSpecimen ? (darkTheme.buttonBg || theme.primary) : theme.buttonBg;
          const btnText = isDarkSpecimen ? (darkTheme.buttonText || '#FFFFFF') : theme.buttonText;

          return (
            <div
              className="cms-public-preview p-8 rounded-2xl border transition-colors duration-200 space-y-6"
              style={{
                backgroundColor: bg,
                borderColor: border,
                color: body,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.accent }}
                >
                  {isDarkSpecimen ? 'Public Dark Mode Specimen' : 'Public Light Mode Specimen'}
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded border"
                  style={{ borderColor: border, color: isDarkSpecimen ? darkTheme.mutedText : theme.mutedText }}
                >
                  CTA Style: {currentColorStyle.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-extrabold tracking-tight" style={{ color: heading }}>
                  High-Performance Enterprise Architecture
                </h4>
                <p className="text-sm max-w-xl leading-relaxed" style={{ color: body }}>
                  This specimen reflects exact public website variables in{' '}
                  <strong style={{ color: heading }}>{isDarkSpecimen ? 'Dark Mode' : 'Light Mode'}</strong>. Every surface, heading ink, body contrast, and button border adheres to your configured tokens.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-xs transition-all cursor-pointer"
                  style={
                    currentColorStyle === 'gradient'
                      ? {
                          background: `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`,
                          color: '#ffffff',
                          border: 'none',
                        }
                      : currentColorStyle === 'outline'
                      ? {
                          backgroundColor: 'transparent',
                          color: theme.primary,
                          border: `2px solid ${theme.primary}`,
                        }
                      : {
                          backgroundColor: btnBg,
                          color: btnText,
                          border: '1px solid transparent',
                        }
                  }
                >
                  Schedule Consultation
                </button>

                <div
                  className="px-4 py-2.5 text-xs font-semibold rounded-lg border flex items-center gap-2"
                  style={{ backgroundColor: surface, borderColor: border, color: heading }}
                >
                  <span>Surface Card Preview</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Link to Animation Studio banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-500/10 border-amber-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Animation Studio & Custom Cursor Follower
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Looking for cursor effects, scroll entrance triggers, hover scales, or custom cursors? Configure them in the dedicated Animation Studio.
            </p>
          </div>
        </div>
        <Link
          to="/admin/animations"
          className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <span>Open Animation Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
