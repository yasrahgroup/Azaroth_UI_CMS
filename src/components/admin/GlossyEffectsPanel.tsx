import React, { useMemo, useState } from 'react';
import { Eye, Plus, RotateCcw, Sparkles } from 'lucide-react';
import type { GlossyEffectConfig, GlossyPreset, GlossyTarget } from '../../types';
import { createGlossyEffect, GLOSSY_PRESETS } from '../../utils/glossyEffects';

interface Props {
  effects: GlossyEffectConfig[];
  onChange: (effects: GlossyEffectConfig[]) => void;
  isLight: boolean;
  previewDevice: 'desktop' | 'tablet' | 'mobile';
  onPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile') => void;
  effectsEnabled: boolean;
  onEffectsEnabledChange: (enabled: boolean) => void;
}

export const GlossyEffectsPanel: React.FC<Props> = ({ effects, onChange, isLight, previewDevice, onPreviewDevice, effectsEnabled, onEffectsEnabledChange }) => {
  const [selectedId, setSelectedId] = useState(effects[0]?.id || '');
  const [replayKey, setReplayKey] = useState(0);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const active = effects.find((effect) => effect.id === selectedId) || effects[0];
  const panel = isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800';
  const text = isLight ? 'text-slate-800' : 'text-white';

  const variables = useMemo<React.CSSProperties>(() => active ? ({
    '--gloss-base': active.baseColor,
    '--gloss-highlight': active.highlightColor,
    '--gloss-gradient-start': active.gradientStart,
    '--gloss-gradient-end': active.gradientEnd,
    '--gloss-border': active.borderColor,
    '--gloss-border-alpha': active.borderOpacity / 100,
    '--gloss-opacity': active.opacity / 100,
    '--gloss-transparency': active.transparency / 100,
    '--gloss-intensity': active.intensity / 100,
    '--gloss-highlight-alpha': active.highlightOpacity / 100,
    '--gloss-blur': `${active.blur}px`,
    '--gloss-shadow-alpha': active.shadow / 100,
    '--gloss-glow': active.glowColor,
    '--gloss-glow-spread': `${active.glowSpread}px`,
    '--gloss-radius': `${active.borderRadius}px`,
    '--gloss-border-width': `${active.borderWidth}px`,
    '--gloss-reflection-size': `${active.reflectionSize}%`,
    '--gloss-shine-duration': `${active.shineDurationMs}ms`,
    '--gloss-shine-delay': `${active.shineDelayMs}ms`,
    '--gloss-hover-scale': active.hoverScale,
    '--gloss-hover-lift': `${active.hoverElevation}px`,
    '--gloss-hover-intensity': active.hoverIntensity / 100,
    '--gloss-shine-angle': active.shineDirection === 'top-bottom' ? '180deg' : active.shineDirection === 'right-left' ? '250deg' : active.shineDirection === 'left-right' ? '110deg' : '135deg',
  } as React.CSSProperties) : {}, [active]);

  const update = (patch: Partial<GlossyEffectConfig>) => {
    if (!active) return;
    onChange(effects.map((effect) => effect.id === active.id ? { ...effect, ...patch } : effect));
  };

  const playPreview = () => {
    setReplayKey((key) => key + 1);
    setPreviewPlaying(true);
    window.setTimeout(() => setPreviewPlaying(false), active?.shineDurationMs || 1800);
  };

  const addPreset = (preset: GlossyPreset) => {
    const effect = createGlossyEffect(preset, `gloss-${preset}-${Date.now()}`);
    onChange([effect, ...effects]);
    setSelectedId(effect.id);
  };

  const fieldClass = `w-full rounded-lg border px-2.5 py-2 text-xs ${isLight ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-700 bg-slate-900 text-slate-100'}`;
  const range = (label: string, key: keyof GlossyEffectConfig, min: number, max: number, unit = '') => (
    <label className="block space-y-1.5" key={String(key)}>
      <span className={`flex justify-between text-[11px] font-medium ${text}`}><span>{label}</span><span>{String(active?.[key])}{unit}</span></span>
      <input type="range" min={min} max={max} step={key === 'hoverScale' ? 0.01 : 1}
        value={Number(active?.[key] ?? min)} onChange={(event) => update({ [key]: Number(event.target.value) } as Partial<GlossyEffectConfig>)}
        className="w-full accent-[#A855F7]" />
    </label>
  );

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-5 shadow-sm ${panel}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className={`flex items-center gap-2 text-base font-bold ${text}`}><Sparkles className="h-4 w-4 text-[#D5A13C]" /> Glossy Effects Library</h3>
            <p className="mt-1 text-xs text-slate-500">Effects are stored independently from motion and can be assigned to sections in Page Builder.</p>
          </div>
          <span className="rounded-full bg-[#A855F7]/10 px-3 py-1 text-[10px] font-bold uppercase text-[#6B21A8]">{effects.length} saved</span>
        </div>
        <label className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold ${text}`}>
          <input type="checkbox" checked={effectsEnabled} onChange={(event) => onEffectsEnabledChange(event.target.checked)} /> Enable glossy effects globally
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {GLOSSY_PRESETS.map((preset) => (
            <article key={preset.id} className={`rounded-xl border p-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-900/50'}`}>
              <h4 className={`text-xs font-bold ${text}`}>{preset.name}</h4>
              <p className="mt-1 min-h-8 text-[10px] leading-4 text-slate-500">{preset.description}</p>
              <button type="button" onClick={() => addPreset(preset.id)} className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#35123F] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#24102D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A855F7]">
                <Plus className="h-3 w-3" /> Add preset
              </button>
            </article>
          ))}
        </div>
      </div>

      {active && <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)]">
        <section className={`space-y-4 rounded-2xl border p-5 ${panel}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Selected effect
              <select className={fieldClass} value={active.id} onChange={(event) => setSelectedId(event.target.value)}>
                {effects.map((effect) => <option key={effect.id} value={effect.id}>{effect.name}</option>)}
              </select>
            </label>
            <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Apply to
              <select className={fieldClass} value={active.target} onChange={(event) => update({ target: event.target.value as GlossyTarget })}>
                <option value="section">Section / panel</option><option value="buttons">Buttons and links</option>
                <option value="cards">Cards</option><option value="images">Images and video</option><option value="text">Headings and text</option>
              </select>
            </label>
            <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Preset
              <select className={fieldClass} value={active.preset} onChange={(event) => {
                const preset = event.target.value as GlossyPreset;
                const defaults = createGlossyEffect(preset, active.id);
                update({ ...defaults, name: GLOSSY_PRESETS.find((item) => item.id === preset)?.name || active.name });
              }}>{GLOSSY_PRESETS.map((preset) => <option value={preset.id} key={preset.id}>{preset.name}</option>)}</select>
            </label>
            <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Effect name
              <input className={fieldClass} value={active.name} maxLength={80} onChange={(event) => update({ name: event.target.value })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className={`flex items-center gap-2 text-xs ${text}`}><input type="checkbox" checked={active.enabled} onChange={(event) => update({ enabled: event.target.checked })} /> Effect enabled</label>
            <label className={`flex items-center gap-2 text-xs ${text}`}><input type="checkbox" checked={active.shineEnabled} onChange={(event) => update({ shineEnabled: event.target.checked })} /> Animated shine</label>
            <label className={`flex items-center gap-2 text-xs ${text}`}><input type="checkbox" checked={active.pointerHighlight} onChange={(event) => update({ pointerHighlight: event.target.checked })} /> Pointer highlight</label>
          </div>

          <details open className="space-y-3">
            <summary className={`cursor-pointer text-xs font-bold ${text}`}>Appearance and surface</summary>
            <div className="grid gap-4 sm:grid-cols-2">
              {range('Intensity', 'intensity', 0, 100, '%')}{range('Gloss opacity', 'opacity', 0, 100, '%')}
              {range('Highlight opacity', 'highlightOpacity', 0, 100, '%')}{range('Background transparency', 'transparency', 0, 100, '%')}
              {range('Blur strength', 'blur', 0, 28, 'px')}{range('Shadow intensity', 'shadow', 0, 100, '%')}
              {range('Border thickness', 'borderWidth', 0, 8, 'px')}{range('Border radius', 'borderRadius', 0, 48, 'px')}
              {range('Border opacity', 'borderOpacity', 0, 100, '%')}{range('Glow spread', 'glowSpread', 0, 50, 'px')}
              {range('Reflection size', 'reflectionSize', 5, 90, '%')}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {([['Base color', 'baseColor'], ['Highlight color', 'highlightColor'], ['Gradient start', 'gradientStart'], ['Gradient end', 'gradientEnd'], ['Border color', 'borderColor'], ['Glow color', 'glowColor']] as const).map(([label, key]) => (
                <label key={key} className={`flex items-center justify-between gap-3 text-[11px] font-medium ${text}`}>{label}
                  <input type="color" value={active[key]} onChange={(event) => update({ [key]: event.target.value } as Partial<GlossyEffectConfig>)} className="h-8 w-12 cursor-pointer rounded border border-slate-300 bg-white p-0.5" />
                </label>
              ))}
            </div>
          </details>

          <details className="space-y-3">
            <summary className={`cursor-pointer text-xs font-bold ${text}`}>Animation and interaction</summary>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Trigger<select className={fieldClass} value={active.trigger} onChange={(event) => update({ trigger: event.target.value as GlossyEffectConfig['trigger'] })}>{['always','hover','focus','scroll','manual'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Shine direction<select className={fieldClass} value={active.shineDirection} onChange={(event) => update({ shineDirection: event.target.value as GlossyEffectConfig['shineDirection'] })}><option value="left-right">Left to right</option><option value="right-left">Right to left</option><option value="top-bottom">Top to bottom</option><option value="diagonal">Diagonal</option></select></label>
              <label className={`space-y-1 text-[11px] font-semibold ${text}`}>Repeat<select className={fieldClass} value={active.shineRepeat} onChange={(event) => update({ shineRepeat: event.target.value as GlossyEffectConfig['shineRepeat'] })}><option value="once">Once</option><option value="loop">Continuous</option><option value="hover">On hover</option></select></label>
              {range('Shine duration', 'shineDurationMs', 250, 6000, 'ms')}{range('Shine delay', 'shineDelayMs', 0, 5000, 'ms')}
              {range('Hover intensity', 'hoverIntensity', 0, 100, '%')}{range('Hover scale', 'hoverScale', 1, 1.12, '×')}
              {range('Hover elevation', 'hoverElevation', 0, 24, 'px')}
            </div>
          </details>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={playPreview} className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-3 py-2 text-xs font-bold text-white"><Eye className="h-3.5 w-3.5" /> Play / replay</button>
            <button type="button" onClick={() => update(createGlossyEffect(active.preset, active.id))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"><RotateCcw className="h-3.5 w-3.5" /> Reset defaults</button>
            <button type="button" onClick={() => { onChange(effects.filter((effect) => effect.id !== active.id)); setSelectedId(effects.find((effect) => effect.id !== active.id)?.id || ''); }} className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700">Remove effect</button>
          </div>
        </section>

        <section className={`rounded-2xl border p-5 ${panel}`} aria-label="Glossy effect live preview">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className={`text-sm font-bold ${text}`}>Live preview</h3><div className="flex gap-1" aria-label="Preview size">{(['desktop','tablet','mobile'] as const).map((device) => <button key={device} type="button" aria-pressed={previewDevice === device} onClick={() => onPreviewDevice(device)} className={`rounded px-2 py-1 text-[10px] capitalize ${previewDevice === device ? 'bg-[#35123F] text-white' : 'border border-slate-300 text-slate-600'}`}>{device}</button>)}</div></div>
          <div key={replayKey} className="rounded-2xl bg-[radial-gradient(circle_at_20%_0%,#A855F7_0,transparent_40%),linear-gradient(140deg,#35123F,#24102D)] p-5" style={{ maxWidth: previewDevice === 'mobile' ? 320 : previewDevice === 'tablet' ? 440 : undefined, marginInline: 'auto' }}>
            <div data-gloss-effect={active.preset} data-gloss-target={active.target} data-gloss-trigger={active.trigger} data-gloss-shine-direction={active.shineDirection} data-gloss-shine-repeat={active.shineRepeat} data-gloss-visible="true" data-gloss-pointer-highlight={active.pointerHighlight} data-gloss-preview-playing={previewPlaying} style={variables} className={`gloss-effect ${active.shineEnabled ? 'gloss-effect-shine' : ''} min-h-40 p-5 text-[#24102D] ${active.enabled && effectsEnabled ? '' : 'opacity-50'}`}>
              <h4 className="text-lg font-bold">Azaroth Technology</h4>
              <p className="mt-1 text-sm">Effect preview: {active.name}. This sample keeps its content and focus interactions available.</p>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="gloss-target rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white">Primary action</button><button type="button" className="gloss-target rounded-lg border border-[#D5A13C] bg-white/70 px-4 py-2 text-xs font-semibold">Secondary</button></div>
              <div className="gloss-target mt-4 rounded-xl bg-white/55 p-3 text-xs">Card and image surfaces inherit the configured effect properties.</div>
            </div>
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-500">Preview updates immediately. Settings remain drafts until you publish from Animation Studio. Reduced-motion settings disable moving shine.</p>
        </section>
      </div>}
    </div>
  );
};
