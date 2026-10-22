import React from 'react';
import { Image as ImageIcon, MousePointer } from 'lucide-react';
import type { CursorStudioConfig } from '../../types';

interface CursorStudioPanelProps {
  cursorStudio: CursorStudioConfig;
  isLight: boolean;
  onChange: (patch: Partial<CursorStudioConfig>) => void;
  onBrowseMedia: () => void;
}

export const CursorStudioPanel: React.FC<CursorStudioPanelProps> = ({
  cursorStudio,
  isLight,
  onChange,
  onBrowseMedia,
}) => {
  const fieldClass = `w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-[#35123F] ${
    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
  }`;
  const cardClass = isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800';
  const mutedClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const labelClass = `text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`;

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className={`rounded-2xl border p-5 shadow-xs ${cardClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#35123F]/10 text-[#35123F]">
              <MousePointer className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Cursor Studio
              </h3>
              <p className={`text-xs mt-0.5 ${mutedClass}`}>
                Make the mouse pointer match your brand. This is optional and separate from page animations.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer" title="Turn the custom cursor on or off">
            <input
              type="checkbox"
              checked={cursorStudio.enabled}
              onChange={(e) => onChange({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <span className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#35123F]" />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <label className={labelClass}>Cursor shape</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {[
              { id: 'classic-ring', label: 'Classic ring', desc: 'A soft ring that follows the pointer' },
              { id: 'neon-glow', label: 'Glow aura', desc: 'A luminous glow around the pointer' },
              { id: 'minimal-dot', label: 'Simple dot', desc: 'A precise, minimal tracking dot' },
              { id: 'magnetic-circle', label: 'Soft circle', desc: 'A smooth blurred circle' },
              { id: 'custom-image', label: 'Custom image', desc: 'Use an image from the Media Library' },
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => onChange({ style: style.id as CursorStudioConfig['style'] })}
                aria-pressed={cursorStudio.style === style.id}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  cursorStudio.style === style.id
                    ? 'border-[#35123F] ring-2 ring-[#35123F]/20 bg-rose-50/20 text-[#35123F]'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600 text-slate-300'
                }`}
              >
                <span className="text-xs font-bold block">{style.label}</span>
                <span className={`text-[10px] block mt-0.5 ${mutedClass}`}>{style.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {cursorStudio.style === 'custom-image' && (
          <div
            className={`mt-4 p-4 rounded-xl border space-y-3 ${
              isLight ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-500/10 border-amber-500/20'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  Custom cursor image
                </h4>
                <p className={`text-[11px] ${mutedClass}`}>Choose a brand symbol or icon from your Media Library.</p>
              </div>
              <button
                type="button"
                onClick={onBrowseMedia}
                className="px-3.5 py-1.5 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Choose image</span>
              </button>
            </div>

            {cursorStudio.customImageUrl && (
              <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-lg bg-black/10 border p-1 flex items-center justify-center">
                  <img src={cursorStudio.customImageUrl} alt="Custom cursor preview" className="w-full h-full object-contain" />
                </div>
                <span className="text-xs font-mono truncate max-w-sm text-slate-500">
                  {cursorStudio.customImageUrl}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
            <label className={labelClass}>Cursor size: {cursorStudio.size}px</label>
            <input
              type="range"
              min="16"
              max="72"
              value={cursorStudio.size}
              onChange={(e) => onChange({ size: parseInt(e.target.value, 10) })}
              className="w-full accent-[#35123F] cursor-pointer"
            />
          </div>

          <div className={`space-y-1.5 p-3 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
            <label className={labelClass}>Cursor colour</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={cursorStudio.color || '#35123F'}
                onChange={(e) => onChange({ color: e.target.value })}
                className="w-9 h-9 shrink-0 rounded border border-slate-300 cursor-pointer bg-white p-0"
              />
              <input
                type="text"
                value={cursorStudio.color || '#35123F'}
                onChange={(e) => onChange({ color: e.target.value })}
                className={`flex-1 min-w-0 px-2 py-1 text-xs font-mono border rounded outline-none ${
                  isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className={`p-3 rounded-lg border space-y-1.5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'}`}>
            <label className={labelClass} title="Higher values make the pointer follow more smoothly but a little later.">
              Movement smoothing
            </label>
            <input
              type="range"
              min="0.05"
              max="0.35"
              step="0.05"
              value={cursorStudio.movementSmoothing}
              onChange={(e) => onChange({ movementSmoothing: parseFloat(e.target.value) })}
              className="w-full accent-[#35123F] cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClass}>What happens on hover?</label>
            <select
              value={cursorStudio.hoverTransform}
              onChange={(e) => onChange({ hoverTransform: e.target.value as CursorStudioConfig['hoverTransform'] })}
              className={fieldClass}
            >
              <option value="scale-up">Grow a little</option>
              <option value="ring-expand">Expand the ring</option>
              <option value="glow">Add a soft glow</option>
              <option value="none">Keep the same shape</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Pointer trail</label>
            <select
              value={cursorStudio.trailEffect}
              onChange={(e) => onChange({ trailEffect: e.target.value as CursorStudioConfig['trailEffect'] })}
              className={fieldClass}
            >
              <option value="none">No trail</option>
              <option value="particles">Subtle particles</option>
            </select>
          </div>
        </div>

        <p className={`mt-4 text-[11px] leading-5 ${mutedClass}`}>
          The custom cursor is automatically disabled on touch devices and when a visitor prefers reduced motion.
        </p>
      </div>
    </div>
  );
};
