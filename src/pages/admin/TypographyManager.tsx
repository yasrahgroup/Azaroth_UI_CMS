import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Type, Check, Save } from 'lucide-react';
import type { TypographyConfig } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants/defaultSettings';

export const TypographyManager: React.FC = () => {
  const { editorSettings, updateDraftSettings, publishSettings, isSaving } = useTheme();
  const [feedback, setFeedback] = useState<string | null>(null);

  const typo = editorSettings?.typography || DEFAULT_SETTINGS.typography;


  const handleUpdate = async (field: keyof TypographyConfig, value: any) => {
    const updated = {
      ...typo,
      [field]: value,
    };
    await updateDraftSettings({ typography: updated });
    setFeedback('Typography settings updated');
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Typography & Font Scales</h2>
          <p className="text-xs text-slate-500 mt-1">
            Visual controls for heading and body font pairings, base font size, line-height, and letter tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && (
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded font-medium flex items-center gap-1.5 shadow-2xs">
              <Check className="w-3.5 h-3.5" />
              {feedback}
            </span>
          )}
          <button
            onClick={async () => {
              await publishSettings();
              setFeedback('Typography settings published live to website!');
              setTimeout(() => setFeedback(null), 3000);
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#35123F] to-[#800A26] hover:brightness-110 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Publishing...' : 'Save & Publish Live'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Font Family Selection */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Approved Font Pairings</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Heading Display Font
            </label>
            <select
              value={typo.headingFont}
              onChange={(e) => handleUpdate('headingFont', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none bg-white font-medium"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans (Geometric Neo-Grotesque)</option>
              <option value="Outfit">Outfit (Clean High-Tech Display)</option>
              <option value="Playfair Display">Playfair Display (Luxury Editorial Serif)</option>
              <option value="DM Sans">DM Sans (Humanist Modern Sans)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Body Prose Font
            </label>
            <select
              value={typo.bodyFont}
              onChange={(e) => handleUpdate('bodyFont', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none bg-white font-medium"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="DM Sans">DM Sans</option>
              <option value="Outfit">Outfit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Letter Spacing (Tracking)
            </label>
            <select
              value={typo.letterSpacing}
              onChange={(e) => handleUpdate('letterSpacing', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none bg-white font-medium"
            >
              <option value="-0.03em">Tight (-0.03em)</option>
              <option value="-0.02em">Balanced (-0.02em - Recommended)</option>
              <option value="0em">Neutral (0em)</option>
              <option value="0.02em">Relaxed (+0.02em)</option>
            </select>
          </div>
        </div>

        {/* Font Scaling Sliders */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Proportions & Rhythm</h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">
                Base Body Font Size
              </label>
              <span className="text-xs font-mono font-bold text-[#35123F]">
                {typo.baseFontSize}px
              </span>
            </div>
            <input
              type="range"
              min="14"
              max="20"
              step="1"
              value={typo.baseFontSize}
              onChange={(e) => handleUpdate('baseFontSize', parseInt(e.target.value, 10))}
              className="w-full accent-[#35123F]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">
                Heading Scale Multiplier
              </label>
              <span className="text-xs font-mono font-bold text-[#35123F]">
                {typo.headingScale}x
              </span>
            </div>
            <input
              type="range"
              min="1.15"
              max="1.4"
              step="0.05"
              value={typo.headingScale}
              onChange={(e) => handleUpdate('headingScale', parseFloat(e.target.value))}
              className="w-full accent-[#35123F]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">
                Body Line Height
              </label>
              <span className="text-xs font-mono font-bold text-[#35123F]">
                {typo.lineHeight}
              </span>
            </div>
            <input
              type="range"
              min="1.4"
              max="1.8"
              step="0.05"
              value={typo.lineHeight}
              onChange={(e) => handleUpdate('lineHeight', parseFloat(e.target.value))}
              className="w-full accent-[#35123F]"
            />
          </div>
        </div>
      </div>

      {/* Live Typography Hierarchy Preview */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Live Typography Hierarchy Preview</h3>
        <div className="cms-public-preview p-8 rounded-xl bg-[#FAF7F2] border border-slate-200 space-y-6">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#35123F] font-bold">
              01. Headline H1 Specimen
            </span>
            <h1
              className="font-extrabold tracking-tight text-[#171B2C]"
              style={{
                fontFamily: typo.headingFont,
                fontSize: `${typo.baseFontSize * typo.headingScale * 2}px`,
                letterSpacing: typo.letterSpacing,
              }}
            >
              Enterprise Systems Without Friction
            </h1>
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#35123F] font-bold">
              02. Section Heading H2 Specimen
            </span>
            <h2
              className="font-bold tracking-tight text-[#171B2C]"
              style={{
                fontFamily: typo.headingFont,
                fontSize: `${typo.baseFontSize * typo.headingScale * 1.5}px`,
                letterSpacing: typo.letterSpacing,
              }}
            >
              Autonomous Biometric Ingestion & Telemetry
            </h2>
          </div>

          <div className="space-y-1 max-w-2xl">
            <span className="text-xs uppercase tracking-wider text-[#35123F] font-bold">
              03. Body Prose Specimen
            </span>
            <p
              className="text-[#334155]"
              style={{
                fontFamily: typo.bodyFont,
                fontSize: `${typo.baseFontSize}px`,
                lineHeight: typo.lineHeight,
                letterSpacing: typo.letterSpacing,
              }}
            >
              Azaroth Tech-Hive delivers end-to-end architectures that scale gracefully under peak
              concurrency. Our platforms guarantee sovereign data portability, parameterized query
              integrity, and seamless bidirectional synchronization with legacy enterprise systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
