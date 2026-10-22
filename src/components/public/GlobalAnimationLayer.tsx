import React, { useEffect, useState } from 'react';
import { getAnimationClass } from '../../utils/animationEffects';
import { isOrbitalAnimation } from '../../constants/animationCatalog';
import type { StudioAnimation } from '../../types';
import { useTheme } from '../../context/ThemeContext';

/**
 * Page-level ambient animation renderer.
 *
 * Animations whose `targetScope` is `global` are page-level decoration, NOT
 * per-section entrance presets. They must be rendered once at the page level
 * (here) instead of being folded into every section's activePreset, otherwise
 * a single continuous rotation/spin class is applied to all page content and
 * the whole page rotates forever.
 */
const SHAPE_STYLES: Record<string, string> = {
  'disc-drift':
    'h-14 w-20 rounded-[45%] bg-[linear-gradient(145deg,#fdf6e8,#d5a13c_38%,#7c3aed_100%)] shadow-[0_16px_28px_-14px_rgba(53,18,63,0.65)]',
  'disc-float':
    'h-14 w-14 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff,#c9a4ef_16%,#5b2b78_55%,#1b0b24_100%)] shadow-[0_18px_30px_-12px_rgba(53,18,63,0.7)]',
  'sphere-float':
    'h-16 w-16 rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,#c9a4ef_16%,#5b2b78_55%,#1b0b24_100%)] shadow-[0_18px_30px_-12px_rgba(53,18,63,0.7)]',
};

export const GlobalAnimationLayer: React.FC = () => {
  const { activeSettings, isPublicDarkActive } = useTheme();
  const isPublicDark = isPublicDarkActive;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const update = () => setReducedMotion(query.matches);
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  const animationsEnabled = activeSettings?.animation?.animationsEnabled !== false;
  const animations: StudioAnimation[] = activeSettings?.animation?.animations || [];

  const globalAnimations = animationsEnabled
    ? animations.filter(
        (a) =>
          a.enabled &&
          (a.targetScope === 'global' || a.targetComponent === 'all') &&
          !isOrbitalAnimation(a.type)
      )
    : [];

  if (globalAnimations.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      aria-hidden="true"
    >
      {globalAnimations.map((anim) => {
        const shapeClass = SHAPE_STYLES[anim.type];
        const animationClass = !reducedMotion ? getAnimationClass(anim.type) : '';
        const duration = Math.max(120, Number(anim.durationMs) || 6000);
        const delay = Math.max(0, Number(anim.delayMs) || 0);
        const easing = anim.easing || 'cubic-bezier(0.16, 1, 0.3, 1)';
        const isLoop = anim.repeatCount === 'infinite';

        const style: React.CSSProperties = {
          animationDuration: `${duration}ms`,
          animationDelay: `${delay}ms`,
          animationTimingFunction: easing,
          animationIterationCount: isLoop ? 'infinite' : 1,
          animationPlayState: reducedMotion ? 'paused' : 'running',
        };

        const positionStyle: React.CSSProperties = {
          position: 'absolute',
          ...(anim.direction === 'left' ? { left: '-10%' } : {}),
          ...(anim.direction === 'right' ? { right: '-10%' } : {}),
          ...(anim.direction === 'up' ? { top: '-10%' } : {}),
          ...(anim.direction === 'down' ? { bottom: '-10%' } : {}),
        };

        if (shapeClass) {
          return (
            <span
              key={anim.id}
              style={{ ...style, ...positionStyle }}
              className={shapeClass}
            />
          );
        }

        return null;
      })}
    </div>
  );
};

export default GlobalAnimationLayer;