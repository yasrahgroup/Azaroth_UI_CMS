import React from 'react';

export type OrbitalStyle = 'classic' | 'dual-ring' | 'nebula';

export interface OrbitalVisualProps {
  stylePreset?: OrbitalStyle;
  primaryColor?: string;
  accentColor?: string;
  speedSeconds?: number;
  className?: string;
  animated?: boolean;
}

export const OrbitalVisual: React.FC<OrbitalVisualProps> = ({
  stylePreset = 'classic',
  primaryColor = '#35123F',
  accentColor = '#D5A13C',
  speedSeconds = 14,
  className = '',
  animated = true,
}) => {
  const safeSpeed = Math.max(3, Math.min(60, speedSeconds || 14));
  const preset = stylePreset;

  const variables = {
    '--orb-primary': primaryColor,
    '--orb-accent': accentColor,
    '--orb-speed': `${safeSpeed}s`,
  } as React.CSSProperties;

  return (
    <div
      className={`orbital-visual orbital-visual-${preset} ${animated ? '' : 'orbital-visual-static'} ${className}`}
      style={variables}
      role="img"
      aria-label="Decorative three-dimensional sphere"
    >
      <div className="orbital-visual-aura" aria-hidden="true" />
      <div className="orbital-visual-stars" aria-hidden="true">
        <span /><span /><span /><span /><span /><span />
      </div>

      <div className="orbital-visual-sphere" aria-hidden="true">
        <span className="orbital-visual-sphere-highlight" />
        <span className="orbital-visual-sphere-shade" />
      </div>
    </div>
  );
};
