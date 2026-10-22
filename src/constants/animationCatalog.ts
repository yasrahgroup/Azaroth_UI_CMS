import type { AnimationCategory, AnimationType, StudioAnimation } from '../types';

export type SimpleAnimationCategory =
  | 'movement'
  | 'rotation'
  | 'appearance'
  | 'hover'
  | 'background'
  | '3d';

export interface AnimationCatalogItem {
  id: string;
  name: string;
  short: string;
  type: AnimationType;
  categories: SimpleAnimationCategory[];
  trigger: StudioAnimation['trigger'];
  targetComponent: string;
  durationMs: number;
  intensity: StudioAnimation['intensity'];
  direction?: StudioAnimation['direction'];
  easing?: string;
  repeatCount?: StudioAnimation['repeatCount'];
  scrollThreshold?: number;
  legacyCategory: AnimationCategory;
}

export const CATEGORY_INFO: Array<{
  id: SimpleAnimationCategory;
  label: string;
  description: string;
}> = [
  {
    id: 'movement',
    label: 'Movement',
    description: 'Float, drift, slide, and bounce into place.',
  },
  {
    id: 'rotation',
    label: 'Rotation',
    description: 'Spin, orbit, and reverse spin.',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Fade, reveal, and scale in.',
  },
  {
    id: 'hover',
    label: 'Hover Effects',
    description: 'Respond when a visitor moves over an element.',
  },
  {
    id: 'background',
    label: 'Background Effects',
    description: 'Ambient motion, floating shapes, and decoration.',
  },
  {
    id: '3d',
    label: '3D Effects',
    description: 'Spheres, orbital rings, depth, and layered motion.',
  },
];

export const CATEGORY_LABEL: Record<SimpleAnimationCategory, string> = {
  movement: 'Movement',
  rotation: 'Rotation',
  appearance: 'Appearance',
  hover: 'Hover Effects',
  background: 'Background Effects',
  '3d': '3D Effects',
};

export const TARGET_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: 'all', label: 'Whole page', hint: 'Apply to all matching elements' },
  { value: 'hero', label: 'Hero banner', hint: 'The main headline and call-to-action area' },
  { value: 'cards', label: 'Cards & tiles', hint: 'Product cards, feature cards, and tiles' },
  { value: 'buttons', label: 'Buttons & links', hint: 'Calls to action and navigational links' },
  { value: 'headings', label: 'Headings & titles', hint: 'Section titles and large headings' },
  { value: 'images', label: 'Images & media', hint: 'Photos, videos, and showcase media' },
  { value: 'feature_grid', label: 'Feature grid', hint: 'A grid of features or services' },
  { value: 'decoration', label: 'Decorative shapes', hint: 'Spheres, rings, discs, and background art' },
];

export const TARGET_LABEL: Record<string, string> = TARGET_OPTIONS.reduce<Record<string, string>>(
  (labels, option) => {
    labels[option.value] = option.label;
    return labels;
  },
  {}
);

export const TRIGGER_OPTIONS: Array<{ value: StudioAnimation['trigger']; label: string }> = [
  { value: 'load', label: 'When the page loads' },
  { value: 'scroll', label: 'When it scrolls into view' },
  { value: 'hover', label: 'When the mouse moves over it' },
  { value: 'click', label: 'When it is clicked' },
];

export const TRIGGER_LABEL: Record<string, string> = {
  load: 'On page load',
  scroll: 'On scroll',
  hover: 'On hover',
  click: 'On click',
  entrance: 'When it appears',
  viewport: 'When it enters the screen',
};

export const DIRECTION_OPTIONS: Array<{ value: NonNullable<StudioAnimation['direction']>; label: string }> = [
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'none', label: 'No direction' },
];

export const INTENSITY_OPTIONS: Array<{
  value: 'subtle' | 'medium' | 'expressive';
  label: string;
  hint: string;
}> = [
  { value: 'subtle', label: 'Subtle', hint: 'A gentle, barely-there effect' },
  { value: 'medium', label: 'Balanced', hint: 'A clear effect without being distracting' },
  { value: 'expressive', label: 'Bold', hint: 'A strong effect for key moments' },
];

export const REPEAT_OPTIONS: Array<{ value: 'once' | 'repeat' | 'continuous'; label: string }> = [
  { value: 'once', label: 'Play once' },
  { value: 'repeat', label: 'Repeat a few times' },
  { value: 'continuous', label: 'Continuous motion' },
];

export const EASING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'cubic-bezier(0.16, 1, 0.3, 1)', label: 'Smooth and natural (recommended)' },
  { value: 'ease-out', label: 'Ease out — quick start, soft finish' },
  { value: 'ease-in-out', label: 'Ease in and out — gentle both ways' },
  { value: 'cubic-bezier(0.34, 1.56, 0.64, 1)', label: 'Springy pop' },
  { value: 'linear', label: 'Constant speed' },
];

export const ANIMATION_TYPE_LABEL: Record<string, string> = {
  fade: 'Fade in',
  'fade-in': 'Fade in',
  'fade-up': 'Rise up',
  'slide-up': 'Rise up',
  'slide-down': 'Drop down',
  'slide-left': 'Slide from left',
  'slide-right': 'Slide from right',
  'slide-in': 'Slide in',
  'zoom-in': 'Zoom in',
  'zoom-out': 'Zoom out',
  rotate: 'Rotate in',
  'rotate-in': 'Rotate in',
  reveal: 'Dramatic reveal',
  'hero-dramatic': 'Dramatic reveal',
  stagger: 'Staggered reveal',
  'stagger-cards': 'Staggered reveal',
  tilt: 'Tilt on hover',
  'pulse-glow': 'Glow pulse',
  'pulse-focus': 'Attention pulse',
  magnetic: 'Magnetic pull',
  'card-elevate': 'Lift on hover',
  'hover-scale': 'Grow on hover',
  scale: 'Grow on hover',
  'text-typing': 'Typing text',
  'text-reveal': 'Text reveal',
  'media-parallax': 'Layered parallax',
  'media-zoom': 'Image zoom',
  'disc-drift': 'Disc drift',
  'disc-float': 'Disc float',
  'orbit-spin': 'Orbit spin',
  'orbit-reverse-spin': 'Orbit reverse spin',
  'sphere-float': 'Sphere float',
};

export const ORBITAL_ANIMATION_TYPES: AnimationType[] = [
  'sphere-float',
  'orbit-spin',
  'orbit-reverse-spin',
  'disc-drift',
  'disc-float',
];

export const PRESET_ITEMS: AnimationCatalogItem[] = [
  {
    id: 'orbit-spin',
    name: 'Orbit Spin',
    short: 'Rotates an object around a central point.',
    type: 'orbit-spin',
    categories: ['rotation', '3d'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 6000,
    intensity: 'medium',
    direction: 'none',
    easing: 'linear',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'orbit-reverse-spin',
    name: 'Orbit Reverse Spin',
    short: 'Rotates an object around a central point in the opposite direction.',
    type: 'orbit-reverse-spin',
    categories: ['rotation', '3d'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 6000,
    intensity: 'medium',
    direction: 'none',
    easing: 'linear',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'sphere-float',
    name: 'Sphere Float',
    short: 'Makes a sphere gently move up and down.',
    type: 'sphere-float',
    categories: ['3d', 'background'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 3800,
    intensity: 'subtle',
    direction: 'none',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'disc-drift',
    name: 'Disc Drift',
    short: 'Moves a disc slowly across the screen.',
    type: 'disc-drift',
    categories: ['background', 'movement'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 4200,
    intensity: 'subtle',
    direction: 'none',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'disc-float',
    name: 'Disc Float',
    short: 'Makes a disc gently float in place.',
    type: 'disc-float',
    categories: ['background'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 3400,
    intensity: 'subtle',
    direction: 'none',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'fade-up',
    name: 'Gentle Fade Up',
    short: 'Content softly rises and fades into view.',
    type: 'slide-up',
    categories: ['movement', 'appearance'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 650,
    intensity: 'subtle',
    direction: 'up',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'hero-reveal',
    name: 'Hero Reveal',
    short: 'A dramatic blur-to-focus entrance for a hero headline.',
    type: 'reveal',
    categories: ['appearance'],
    trigger: 'load',
    targetComponent: 'hero',
    durationMs: 900,
    intensity: 'expressive',
    direction: 'up',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'card-lift',
    name: 'Card Lift',
    short: 'Cards gently lift when a visitor hovers over them.',
    type: 'card-elevate',
    categories: ['hover'],
    trigger: 'hover',
    targetComponent: 'cards',
    durationMs: 300,
    intensity: 'medium',
    direction: 'none',
    easing: 'ease-out',
    legacyCategory: 'hover_interaction',
  },
  {
    id: 'stagger',
    name: 'Staggered Grid',
    short: 'Grid items appear one after another as they scroll into view.',
    type: 'stagger',
    categories: ['movement', 'appearance'],
    trigger: 'scroll',
    targetComponent: 'feature_grid',
    durationMs: 600,
    intensity: 'medium',
    direction: 'up',
    scrollThreshold: 0.15,
    legacyCategory: 'scroll',
  },
  {
    id: 'glow-pulse',
    name: 'Button Glow',
    short: 'Adds a soft attention pulse to a button or call to action.',
    type: 'pulse-glow',
    categories: ['hover', 'background'],
    trigger: 'hover',
    targetComponent: 'buttons',
    durationMs: 1800,
    intensity: 'subtle',
    easing: 'ease-out',
    legacyCategory: 'hover_interaction',
  },
];

export const LIBRARY_ITEMS: AnimationCatalogItem[] = [
  {
    id: 'fade-in',
    name: 'Fade In',
    short: 'Softly appears from transparent to visible.',
    type: 'fade',
    categories: ['appearance'],
    trigger: 'load',
    targetComponent: 'all',
    durationMs: 600,
    intensity: 'subtle',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'fade-up',
    name: 'Rise Up',
    short: 'Slides up a little while fading into view.',
    type: 'slide-up',
    categories: ['movement', 'appearance'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 650,
    intensity: 'medium',
    direction: 'up',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'fade-down',
    name: 'Drop Down',
    short: 'Eases down into place while fading in.',
    type: 'slide-down',
    categories: ['movement', 'appearance'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 650,
    intensity: 'medium',
    direction: 'down',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'slide-left',
    name: 'Slide From Left',
    short: 'Glides in from the left side of the screen.',
    type: 'slide-left',
    categories: ['movement'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 650,
    intensity: 'medium',
    direction: 'left',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'slide-right',
    name: 'Slide From Right',
    short: 'Glides in from the right side of the screen.',
    type: 'slide-right',
    categories: ['movement'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 650,
    intensity: 'medium',
    direction: 'right',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    short: 'Grows gently from slightly smaller to full size.',
    type: 'zoom-in',
    categories: ['appearance'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 600,
    intensity: 'medium',
    direction: 'none',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    short: 'Settles back to full size from slightly larger.',
    type: 'zoom-out',
    categories: ['appearance'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 600,
    intensity: 'medium',
    direction: 'none',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'rotate-in',
    name: 'Rotate In',
    short: 'Turns slightly as it fades into place.',
    type: 'rotate',
    categories: ['rotation', 'appearance'],
    trigger: 'scroll',
    targetComponent: 'all',
    durationMs: 650,
    intensity: 'medium',
    direction: 'none',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'hero-reveal',
    name: 'Dramatic Reveal',
    short: 'A cinematic blur-to-focus entrance.',
    type: 'reveal',
    categories: ['appearance'],
    trigger: 'load',
    targetComponent: 'hero',
    durationMs: 900,
    intensity: 'expressive',
    direction: 'up',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'text-reveal',
    name: 'Text Reveal',
    short: 'A heading is uncovered from left to right.',
    type: 'text-reveal',
    categories: ['appearance'],
    trigger: 'scroll',
    targetComponent: 'headings',
    durationMs: 700,
    intensity: 'medium',
    direction: 'left',
    legacyCategory: 'text',
  },
  {
    id: 'stagger',
    name: 'Staggered Reveal',
    short: 'Items appear one after another in a gentle cascade.',
    type: 'stagger',
    categories: ['movement', 'appearance'],
    trigger: 'scroll',
    targetComponent: 'feature_grid',
    durationMs: 600,
    intensity: 'medium',
    direction: 'up',
    scrollThreshold: 0.15,
    legacyCategory: 'scroll',
  },
  {
    id: 'attention-pulse',
    name: 'Attention Pulse',
    short: 'A soft repeating pulse that draws the eye.',
    type: 'pulse-focus',
    categories: ['appearance', 'background'],
    trigger: 'load',
    targetComponent: 'buttons',
    durationMs: 1800,
    intensity: 'subtle',
    repeatCount: 'infinite',
    legacyCategory: 'entrance_exit',
  },
  {
    id: 'disc-drift',
    name: 'Disc Drift',
    short: 'A disc wanders slowly with a gentle rotation.',
    type: 'disc-drift',
    categories: ['background', 'movement'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 4200,
    intensity: 'subtle',
    direction: 'none',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'disc-float',
    name: 'Disc Float',
    short: 'A disc floats gently up and down in place.',
    type: 'disc-float',
    categories: ['background'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 3400,
    intensity: 'subtle',
    direction: 'none',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'orbit-spin',
    name: 'Orbit Spin',
    short: 'An object travels around a central point.',
    type: 'orbit-spin',
    categories: ['rotation', '3d'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 6000,
    intensity: 'medium',
    direction: 'none',
    easing: 'linear',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'orbit-reverse-spin',
    name: 'Orbit Reverse Spin',
    short: 'An object travels around a central point in reverse.',
    type: 'orbit-reverse-spin',
    categories: ['rotation', '3d'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 6000,
    intensity: 'medium',
    direction: 'none',
    easing: 'linear',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'sphere-float',
    name: 'Sphere Float',
    short: 'A sphere gently rises and settles in a loop.',
    type: 'sphere-float',
    categories: ['3d', 'background'],
    trigger: 'load',
    targetComponent: 'decoration',
    durationMs: 3800,
    intensity: 'subtle',
    direction: 'none',
    repeatCount: 'infinite',
    legacyCategory: 'continuous',
  },
  {
    id: 'card-lift',
    name: 'Lift On Hover',
    short: 'A card rises and gains a soft shadow on hover.',
    type: 'card-elevate',
    categories: ['hover'],
    trigger: 'hover',
    targetComponent: 'cards',
    durationMs: 300,
    intensity: 'medium',
    direction: 'none',
    easing: 'ease-out',
    legacyCategory: 'hover_interaction',
  },
  {
    id: 'hover-scale',
    name: 'Grow On Hover',
    short: 'An element gently grows when a visitor hovers over it.',
    type: 'scale',
    categories: ['hover'],
    trigger: 'hover',
    targetComponent: 'all',
    durationMs: 300,
    intensity: 'medium',
    direction: 'none',
    easing: 'ease-out',
    legacyCategory: 'hover_interaction',
  },
  {
    id: 'glow-pulse',
    name: 'Glow Pulse',
    short: 'A soft glow and pulse for buttons and key actions.',
    type: 'pulse-glow',
    categories: ['hover', 'background'],
    trigger: 'hover',
    targetComponent: 'buttons',
    durationMs: 1800,
    intensity: 'subtle',
    easing: 'ease-out',
    legacyCategory: 'hover_interaction',
  },
  {
    id: 'pointer-tilt',
    name: 'Tilt On Hover',
    short: 'A card tilts in 3D as the pointer moves across it.',
    type: 'tilt',
    categories: ['hover', '3d'],
    trigger: 'hover',
    targetComponent: 'cards',
    durationMs: 350,
    intensity: 'medium',
    direction: 'none',
    easing: 'ease-out',
    legacyCategory: 'hover_interaction',
  },
  {
    id: 'media-zoom',
    name: 'Image Zoom',
    short: 'An image softly zooms in on hover.',
    type: 'media-zoom',
    categories: ['hover'],
    trigger: 'hover',
    targetComponent: 'images',
    durationMs: 450,
    intensity: 'subtle',
    direction: 'none',
    easing: 'ease-out',
    legacyCategory: 'image_media',
  },
];

export const ALL_CATALOG_ITEMS: AnimationCatalogItem[] = [...PRESET_ITEMS, ...LIBRARY_ITEMS].filter(
  (item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index
);

export function getAnimationTypeLabel(type?: string): string {
  if (!type) return 'Animation';
  return ANIMATION_TYPE_LABEL[type] || type.replace(/[-_]/g, ' ');
}

export function getTargetLabel(target?: string): string {
  if (!target) return 'No target selected';
  return TARGET_LABEL[target] || target.replace(/[-_]/g, ' ');
}

export function getTriggerLabel(trigger?: string): string {
  if (!trigger) return 'No start trigger';
  return TRIGGER_LABEL[trigger] || trigger.replace(/[-_]/g, ' ');
}

export function isOrbitalAnimation(type?: string): boolean {
  return Boolean(type && ORBITAL_ANIMATION_TYPES.includes(type as AnimationType));
}

export function formatDuration(durationMs?: number): string {
  const value = Number(durationMs) || 600;
  if (value >= 1000) {
    const seconds = value / 1000;
    return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
  }
  return `${Math.round(value)}ms`;
}

export function durationToSpeed(durationMs?: number): number {
  const clamped = Math.min(6000, Math.max(200, Number(durationMs) || 600));
  return Math.max(1, Math.min(10, Math.round(10 - ((clamped - 200) / 5800) * 9)));
}

export function speedToDuration(speed: number): number {
  const clamped = Math.min(10, Math.max(1, Number(speed) || 5));
  return Math.round(6000 - ((clamped - 1) / 9) * 5800);
}

export function getSpeedLabel(speed: number): string {
  if (speed >= 9) return 'Very fast';
  if (speed >= 7) return 'Fast';
  if (speed >= 4) return 'Normal';
  if (speed >= 2) return 'Slow';
  return 'Very slow';
}

export function getIntensityValue(intensity: StudioAnimation['intensity']): 'subtle' | 'medium' | 'expressive' {
  if (intensity === 'subtle' || intensity === 'expressive') return intensity;
  if (typeof intensity === 'number') {
    if (intensity <= 0.34) return 'subtle';
    if (intensity >= 0.67) return 'expressive';
  }
  return 'medium';
}

export function getRepeatValue(repeatCount?: StudioAnimation['repeatCount']): 'once' | 'repeat' | 'continuous' {
  if (repeatCount === 'infinite') return 'continuous';
  if (typeof repeatCount === 'number' && repeatCount > 1) return 'repeat';
  return 'once';
}

export function getRepeatCount(value: 'once' | 'repeat' | 'continuous'): StudioAnimation['repeatCount'] {
  if (value === 'continuous') return 'infinite';
  if (value === 'repeat') return 3;
  return 1;
}

export function createStudioAnimationFromTemplate(
  template: AnimationCatalogItem,
  overrides: Partial<StudioAnimation> = {}
): StudioAnimation {
  const now = new Date().toISOString();
  const targetComponent = overrides.targetComponent ?? template.targetComponent;
  const isGlobalTarget = targetComponent === 'all';
  return {
    id: `anim-${template.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: template.name,
    description: template.short,
    category: template.legacyCategory,
    type: template.type,
    targetScope: isGlobalTarget ? 'global' : 'component',
    targetComponent,
    targetComponentType: isGlobalTarget ? 'all' : undefined,
    durationMs: template.durationMs,
    delayMs: 0,
    easing: template.easing || 'cubic-bezier(0.16, 1, 0.3, 1)',
    direction: template.direction || 'up',
    intensity: template.intensity,
    trigger: template.trigger,
    scrollThreshold: template.scrollThreshold ?? 0.15,
    scrollOnce: true,
    repeatCount: template.repeatCount ?? 1,
    alternate: false,
    enabled: true,
    respectReducedMotion: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createBlankAnimation(): StudioAnimation {
  const now = new Date().toISOString();
  return {
    id: `anim-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'My New Animation',
    description: 'A custom animation created in the Animation Editor.',
    category: 'entrance_exit',
    type: 'fade',
    targetScope: 'component',
    targetComponent: 'cards',
    durationMs: 600,
    delayMs: 0,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    direction: 'up',
    intensity: 'medium',
    trigger: 'scroll',
    scrollThreshold: 0.15,
    scrollOnce: true,
    repeatCount: 1,
    alternate: false,
    enabled: true,
    respectReducedMotion: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function withTarget(animation: StudioAnimation, targetComponent: string): StudioAnimation {
  return {
    ...animation,
    targetComponent,
    targetScope: targetComponent === 'all' ? 'global' : 'component',
    targetComponentType: targetComponent === 'all' ? 'all' : undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function findExistingTemplateAnimation(
  animations: StudioAnimation[],
  template: AnimationCatalogItem
): StudioAnimation | undefined {
  return animations.find(
    (animation) => animation.name === template.name && animation.type === template.type
  );
}

export function animationSignature(animation: StudioAnimation | null | undefined): string {
  if (!animation) return '';
  const { createdAt, updatedAt, ...rest } = animation;
  return JSON.stringify({ ...rest, createdAt: '', updatedAt: '' });
}
