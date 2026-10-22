import React from 'react';
import { ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import { OrbitalVisual } from '../public/OrbitalVisual';
import { getAnimationClass } from '../../utils/animationEffects';
import type { StudioAnimation } from '../../types';
import { formatDuration, isOrbitalAnimation } from '../../constants/animationCatalog';

export interface PreviewAnimationLike {
  type?: StudioAnimation['type'] | string;
  durationMs?: number;
  delayMs?: number;
  easing?: string;
  intensity?: StudioAnimation['intensity'];
  repeatCount?: StudioAnimation['repeatCount'];
}

const HOVER_PREVIEW_TYPES = ['card-elevate', 'scale', 'tilt', 'media-zoom'];
const DECORATIVE_SHAPE_TYPES = ['disc-drift', 'disc-float', 'sphere-float'];

function isDecorativeShape(type?: string): boolean {
  return Boolean(type && DECORATIVE_SHAPE_TYPES.includes(type));
}

function shapeClasses(type?: string): string {
  if (type === 'sphere-float') {
    return 'h-16 w-16 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,#c9a4ef_16%,#5b2b78_55%,#1b0b24_100%)] shadow-[0_18px_30px_-12px_rgba(53,18,63,0.7)]';
  }
  return 'h-14 w-20 rounded-[45%] bg-[linear-gradient(145deg,#fdf6e8,#d5a13c_38%,#7c3aed_100%)] shadow-[0_16px_28px_-14px_rgba(53,18,63,0.65)]';
}

function previewStyle(animation: PreviewAnimationLike, playing: boolean, forceLoop = false): React.CSSProperties {
  return {
    animationDuration: `${Math.max(120, Number(animation.durationMs) || 600)}ms`,
    animationDelay: `${Math.max(0, Number(animation.delayMs) || 0)}ms`,
    animationTimingFunction: animation.easing || 'cubic-bezier(0.16, 1, 0.3, 1)',
    animationPlayState: playing ? 'running' : 'paused',
    animationIterationCount: forceLoop || animation.repeatCount === 'infinite' ? 'infinite' : undefined,
  };
}

function orbitalSpeed(animation: PreviewAnimationLike): number {
  return Math.max(3, Math.round((Number(animation.durationMs) || 6000) / 1000));
}

interface MiniPreviewProps {
  animation: PreviewAnimationLike;
  playing?: boolean;
  reducedMotion?: boolean;
  replayKey?: number | string;
  className?: string;
  compact?: boolean;
}

export const MiniAnimationPreview: React.FC<MiniPreviewProps> = ({
  animation,
  playing = true,
  reducedMotion = false,
  replayKey = 0,
  className = '',
  compact = false,
}) => {
  const orbital = isOrbitalAnimation(animation.type);
  const decorativeShape = isDecorativeShape(animation.type);
  const canAnimate = !reducedMotion;
  const animationClass = canAnimate ? getAnimationClass(animation.type) : '';
  const forceHover = HOVER_PREVIEW_TYPES.includes(String(animation.type)) ? 'anim-preview-force' : '';

  return (
    <div
      className={`relative flex ${compact ? 'h-20' : 'h-28'} items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-[radial-gradient(circle_at_20%_0%,#f5e9d7_0,transparent_45%),linear-gradient(145deg,#fdfaf5,#efe7da)] ${className}`}
    >
      {decorativeShape ? (
        <div key={replayKey} className="flex h-full w-full items-center justify-center">
          <span
            style={previewStyle(animation, playing, true)}
            className={`${shapeClasses(animation.type)} ${animationClass}`}
          />
        </div>
      ) : orbital ? (
        <div
          key={replayKey}
          className={`flex h-full w-full items-center justify-center ${playing ? '' : 'orbital-visual-paused'}`}
        >
          <OrbitalVisual
            stylePreset="dual-ring"
            primaryColor="#35123F"
            accentColor="#D5A13C"
            speedSeconds={orbitalSpeed(animation)}
            animated={canAnimate}
            className={compact ? 'orbital-visual--compact-sm' : 'orbital-visual--compact'}
          />
        </div>
      ) : (
        <div
          key={replayKey}
          style={previewStyle(animation, playing, true)}
          className={`w-36 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_-14px_rgba(53,18,63,0.45)] ${animationClass} ${forceHover}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-lg bg-[#35123F]/10 p-1 text-[#35123F]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="h-2 w-16 rounded-full bg-[#35123F]/80" />
          </div>
          <div className="mt-3 space-y-1.5" aria-hidden="true">
            <span className="block h-1.5 w-full rounded-full bg-slate-200" />
            <span className="block h-1.5 w-4/5 rounded-full bg-slate-200" />
          </div>
          <div className="anim-preview-media mt-3 h-9 rounded-md bg-[linear-gradient(135deg,#35123F,#7c3aed_55%,#d5a13c)]" />
        </div>
      )}
      <span className="absolute bottom-2 right-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
        {formatDuration(animation.durationMs)}
      </span>
    </div>
  );
};

interface TargetStageProps {
  animation: PreviewAnimationLike;
  targetComponent?: string;
  playing?: boolean;
  reducedMotion?: boolean;
  replayKey?: number | string;
  className?: string;
}

const SampleCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${compact ? 'w-32' : 'w-full max-w-[210px]'}`}>
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#35123F]/10 text-[#35123F]">
      <Sparkles className="h-4 w-4" />
    </span>
    <h4 className="mt-2 text-sm font-bold text-slate-900">Product feature</h4>
    <p className="mt-1 text-[11px] leading-4 text-slate-500">A short supporting line of text.</p>
  </div>
);

const TargetSample: React.FC<{ target?: string }> = ({ target }) => {
  if (target === 'headings') {
    return (
      <div className="w-full max-w-sm text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5A13C]">Section</span>
        <h3 className="mt-2 font-serif text-2xl font-bold text-slate-900">A clear, confident headline</h3>
      </div>
    );
  }

  if (target === 'buttons') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white shadow-sm">
          Primary action
        </button>
        <button type="button" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700">
          Secondary action
        </button>
      </div>
    );
  }

  if (target === 'images') {
    return (
      <div className="anim-preview-media relative h-32 w-full max-w-xs overflow-hidden rounded-xl bg-[linear-gradient(135deg,#35123F,#7c3aed_55%,#d5a13c)] p-4 text-white shadow-sm">
        <ImageIcon className="h-6 w-6 opacity-80" />
        <span className="absolute bottom-3 left-4 text-xs font-semibold">Showcase image</span>
      </div>
    );
  }

  if (target === 'feature_grid') {
    return (
      <div className="flex w-full max-w-sm items-stretch justify-center gap-2">
        <SampleCard compact />
        <SampleCard compact />
        <SampleCard compact />
      </div>
    );
  }

  if (target === 'hero') {
    return (
      <div className="w-full max-w-sm text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D5A13C]">Azaroth Technology</span>
        <h3 className="mt-2 font-serif text-2xl font-bold leading-tight text-slate-900">
          Enterprise platforms, beautifully delivered.
        </h3>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">A short introduction that supports the headline.</p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="rounded-lg bg-[#35123F] px-4 py-2 text-[11px] font-bold text-white">Get started</span>
          <span className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-[11px] font-semibold text-slate-700">
            Learn more
          </span>
        </div>
      </div>
    );
  }

  if (target === 'all') {
    return (
      <div className="w-full max-w-sm space-y-3">
        <div className="text-center">
          <h3 className="font-serif text-xl font-bold text-slate-900">A complete page sample</h3>
          <p className="mt-1 text-[11px] text-slate-500">Heading, card, and action together.</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <SampleCard compact />
          <div className="flex flex-col gap-2">
            <span className="rounded-lg bg-[#35123F] px-3 py-2 text-[11px] font-bold text-white">Primary action</span>
            <span className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700">
              Learn more <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <SampleCard />
    </div>
  );
};

export const TargetStage: React.FC<TargetStageProps> = ({
  animation,
  targetComponent = 'cards',
  playing = true,
  reducedMotion = false,
  replayKey = 0,
  className = '',
}) => {
  const orbital = isOrbitalAnimation(animation.type) || targetComponent === 'decoration';
  const decorativeShape = isDecorativeShape(animation.type);
  const canAnimate = !reducedMotion;
  const animationClass = canAnimate ? getAnimationClass(animation.type) : '';
  const forceHover = HOVER_PREVIEW_TYPES.includes(String(animation.type)) ? 'anim-preview-force' : '';

  if (decorativeShape) {
    return (
      <div
        className={`relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_50%_10%,#fff7e8_0,transparent_55%),linear-gradient(150deg,#fdfaf5,#efe7da)] p-4 ${className}`}
      >
        <div className="scale-[2.2]">
          <span
            key={replayKey}
            style={previewStyle(animation, playing, true)}
            className={`block ${shapeClasses(animation.type)} ${animationClass}`}
          />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
          Decorative shape preview · {formatDuration(animation.durationMs)}
        </span>
      </div>
    );
  }

  if (orbital) {
    return (
      <div
        className={`relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_50%_10%,#fff7e8_0,transparent_55%),linear-gradient(150deg,#fdfaf5,#efe7da)] p-4 ${className}`}
      >
        <div key={replayKey} className={`w-full ${playing ? '' : 'orbital-visual-paused'}`}>
          <OrbitalVisual
            stylePreset="dual-ring"
            primaryColor="#35123F"
            accentColor="#D5A13C"
            speedSeconds={orbitalSpeed(animation)}
            animated={canAnimate}
            className="min-h-[230px] max-h-[260px]"
          />
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
          Decorative preview · {formatDuration(animation.durationMs)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_20%_0%,#fff7e8_0,transparent_48%),linear-gradient(150deg,#fdfaf5,#f3ece1)] p-6 ${className}`}
    >
      <div key={replayKey} style={previewStyle(animation, playing)} className={`w-full flex justify-center ${animationClass} ${forceHover}`}>
        <TargetSample target={targetComponent} />
      </div>
      <span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
        Sample {targetComponent === 'all' ? 'page' : 'element'} · {formatDuration(animation.durationMs)}
      </span>
    </div>
  );
};
