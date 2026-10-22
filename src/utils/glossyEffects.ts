import type { GlossyEffectConfig, GlossyPreset, GlossyTarget } from '../types';

export const GLOSSY_PRESETS: Array<{ id: GlossyPreset; name: string; description: string; target: GlossyTarget }> = [
  { id: 'glass-surface', name: 'Glass Surface', description: 'Readable translucent surface with soft blur and a fine border.', target: 'section' },
  { id: 'glossy-shine', name: 'Glossy Shine', description: 'A traveling reflection layered above compatible content.', target: 'section' },
  { id: 'glossy-button', name: 'Glossy Button', description: 'Polished color, a top highlight and optional hover shine.', target: 'buttons' },
  { id: 'glossy-card', name: 'Glossy Card', description: 'Softly lit cards with restrained depth and reflection.', target: 'cards' },
  { id: 'glossy-image', name: 'Glossy Image', description: 'A rounded reflective overlay for imagery.', target: 'images' },
  { id: 'soft-glow', name: 'Soft Glow', description: 'A gentle configurable glow around interactive content.', target: 'buttons' },
  { id: 'neon-gloss', name: 'Neon Gloss', description: 'A brighter luminous border for selected interactive elements.', target: 'cards' },
  { id: 'liquid-glass', name: 'Liquid Glass', description: 'Layered translucent glass, blur and a subtle color wash.', target: 'section' },
  { id: 'top-highlight', name: 'Top Highlight', description: 'A stationary reflection along the top edge.', target: 'section' },
  { id: 'iridescent-gloss', name: 'Iridescent Gloss', description: 'A restrained orchid-to-peach reflective gradient.', target: 'cards' },
  { id: 'glossy-text', name: 'Glossy Text', description: 'A readable orchid-to-peach gradient for selected text.', target: 'text' },
  { id: 'glossy-overlay', name: 'Glossy Overlay', description: 'A non-interactive highlight overlay for compatible sections and media.', target: 'section' },
];

export function createGlossyEffect(preset: GlossyPreset, id = `gloss-${preset}`): GlossyEffectConfig {
  const definition = GLOSSY_PRESETS.find((item) => item.id === preset)!;
  return {
    id,
    name: definition.name,
    preset,
    target: definition.target,
    enabled: true,
    intensity: 45,
    opacity: 24,
    highlightOpacity: 38,
    baseColor: '#FAF7F2',
    highlightColor: '#FFFFFF',
    gradientStart: '#A855F7',
    gradientEnd: '#F4A7A3',
    borderColor: '#D5A13C',
    borderOpacity: 30,
    borderWidth: 1,
    borderRadius: 18,
    transparency: 62,
    blur: 12,
    shadow: 24,
    glowColor: '#A855F7',
    glowSpread: 18,
    reflectionSize: 42,
    shineEnabled: preset === 'glossy-shine' || preset === 'glossy-button',
    shineDirection: 'diagonal',
    shineDurationMs: 1800,
    shineDelayMs: 0,
    shineRepeat: 'hover',
    trigger: 'hover',
    hoverIntensity: 35,
    hoverScale: 1.02,
    hoverElevation: 5,
    pointerHighlight: false,
  };
}
