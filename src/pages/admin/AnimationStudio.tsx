import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  Eye,
  HelpCircle,
  Info,
  Layers,
  ListChecks,
  Monitor,
  MousePointer,
  Palette,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Smartphone,
  Sparkles,
  Tablet,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { CursorFollower } from '../../components/public/CursorFollower';
import { GlossyEffectsPanel } from '../../components/admin/GlossyEffectsPanel';
import { CursorStudioPanel } from '../../components/admin/CursorStudioPanel';
import { MiniAnimationPreview, TargetStage, type PreviewAnimationLike } from '../../components/admin/AnimationPreview';
import type {
  AnimationType,
  CursorStudioConfig,
  GlossyEffectConfig,
  StudioAnimation,
} from '../../types';
import {
  ALL_CATALOG_ITEMS,
  CATEGORY_INFO,
  CATEGORY_LABEL,
  DIRECTION_OPTIONS,
  EASING_OPTIONS,
  INTENSITY_OPTIONS,
  LIBRARY_ITEMS,
  PRESET_ITEMS,
  REPEAT_OPTIONS,
  TARGET_OPTIONS,
  TRIGGER_OPTIONS,
  type AnimationCatalogItem,
  type SimpleAnimationCategory,
  animationSignature,
  createBlankAnimation,
  createStudioAnimationFromTemplate,
  durationToSpeed,
  findExistingTemplateAnimation,
  formatDuration,
  getAnimationTypeLabel,
  getIntensityValue,
  getRepeatCount,
  getRepeatValue,
  getSpeedLabel,
  getTargetLabel,
  getTriggerLabel,
  isOrbitalAnimation,
  speedToDuration,
  withTarget,
} from '../../constants/animationCatalog';

type StudioTab = 'presets' | 'library' | 'animator' | 'editor';
type ActivePanel = StudioTab | 'cursor' | 'glossy';
type Notice = { message: string; tone: 'success' | 'error' | 'info' } | null;

const GUIDE_STORAGE_KEY = 'azaroth_animation_studio_guide_dismissed_v2';
const WORKFLOW_STEPS = ['Choose Animation', 'Preview', 'Customize', 'Select Target', 'Apply', 'Save'];

const STUDIO_TABS: Array<{
  id: StudioTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'presets',
    label: 'Animation Presets',
    description: 'Start with a ready-made animation.',
    icon: Sparkles,
  },
  {
    id: 'library',
    label: 'Animation Library',
    description: 'Browse all available animation effects.',
    icon: Layers,
  },
  {
    id: 'animator',
    label: 'Visual Animator',
    description: 'Preview and customize how your animation looks.',
    icon: Eye,
  },
  {
    id: 'editor',
    label: 'Animation Editor',
    description: 'Fine-tune animation settings and behavior.',
    icon: Sliders,
  },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  return reduced;
}

function savedTargetLabel(animation: StudioAnimation): string {
  if (animation.targetComponent) return getTargetLabel(animation.targetComponent);
  if (animation.targetScope === 'global') return 'Whole page';
  return 'No target chosen';
}

interface CatalogCardProps {
  item: AnimationCatalogItem;
  isLight: boolean;
  selected: boolean;
  alreadyInStudio: boolean;
  playing: boolean;
  reducedMotion: boolean;
  replayKey: number;
  onPreview: () => void;
  onUse: () => void;
}

const CatalogCard: React.FC<CatalogCardProps> = ({
  item,
  isLight,
  selected,
  alreadyInStudio,
  playing,
  reducedMotion,
  replayKey,
  onPreview,
  onUse,
}) => (
  <article
    className={`flex flex-col overflow-hidden rounded-xl border p-3 transition-all ${
      selected
        ? isLight
          ? 'border-[#35123F] bg-rose-50/30 ring-2 ring-[#35123F]/15'
          : 'border-[#35123F] bg-[#1A1F36] ring-2 ring-[#35123F]/30'
        : isLight
        ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
        : 'border-slate-800 bg-[#161B2E] hover:border-slate-700'
    }`}
  >
    <MiniAnimationPreview
      animation={item}
      playing={playing}
      reducedMotion={reducedMotion}
      replayKey={replayKey}
    />

    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {item.categories.slice(0, 2).map((category) => (
        <span
          key={category}
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
            isLight ? 'bg-[#35123F]/8 text-[#35123F]' : 'bg-white/10 text-slate-300'
          }`}
        >
          {CATEGORY_LABEL[category]}
        </span>
      ))}
      {selected && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
          <Check className="h-2.5 w-2.5" /> Selected
        </span>
      )}
      {alreadyInStudio && !selected && (
        <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-600">
          In studio
        </span>
      )}
    </div>

    <h4 className={`mt-2 text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</h4>
    <p className={`mt-1 flex-1 text-[11px] leading-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
      {item.short}
    </p>

    <div className={`mt-3 flex items-center justify-between gap-2 border-t pt-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
      <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
        {formatDuration(item.durationMs)} · {getTriggerLabel(item.trigger)}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPreview}
          title={`Preview ${item.name}`}
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
            isLight
              ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Play className="h-3 w-3 text-emerald-500" /> Preview
        </button>
        <button
          type="button"
          onClick={onUse}
          title={`Add ${item.name} to your animations`}
          className="inline-flex items-center gap-1 rounded-lg bg-[#35123F] px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#24102D]"
        >
          <Plus className="h-3 w-3" /> Use
        </button>
      </div>
    </div>
  </article>
);

const EditorGroup: React.FC<{
  number: string;
  title: string;
  description: string;
  isLight: boolean;
  children: React.ReactNode;
}> = ({ number, title, description, isLight, children }) => (
  <section className={`rounded-xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800 bg-slate-900/40'}`}>
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isLight ? 'bg-[#35123F]/10 text-[#35123F]' : 'bg-white/10 text-[#E9C87A]'}`}>
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{title}</h4>
        <p className={`mt-0.5 text-[11px] leading-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{description}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  </section>
);

export const AnimationStudio: React.FC = () => {
  const { editorSettings, updateDraftSettings, publishSettings, isSaving, cmsMode } = useTheme();
  const isLight = cmsMode === 'light';
  const reducedMotion = usePrefersReducedMotion();

  const animationConfig = editorSettings?.animation;
  const animationsList: StudioAnimation[] = animationConfig?.animations || [];
  const animationsEnabled = animationConfig?.animationsEnabled !== false;
  const glossyEffects: GlossyEffectConfig[] = animationConfig?.glossyEffects || [];
  const glossyEffectsEnabled = animationConfig?.glossyEffectsEnabled !== false;

  const cursorStudio: CursorStudioConfig = animationConfig?.cursorStudio || {
    enabled: animationConfig?.cursorFollower ?? true,
    style: animationConfig?.cursorStyle || 'classic-ring',
    customImageUrl: '',
    customImageAlt: '',
    size: 34,
    color: animationConfig?.cursorColor || '#35123F',
    opacity: 1,
    hoverTransform: 'scale-up',
    clickFeedback: 'compress',
    trailEffect: 'none',
    trailLength: 6,
    movementSmoothing: 0.15,
    respectReducedMotion: true,
  };

  const [activeTab, setActiveTab] = useState<ActivePanel>('presets');
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [workingAnimation, setWorkingAnimation] = useState<StudioAnimation | null>(null);
  const [workingOriginal, setWorkingOriginal] = useState<StudioAnimation | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [cardReplayKeys, setCardReplayKeys] = useState<Record<string, number>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [notice, setNotice] = useState<Notice>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [libraryCategory, setLibraryCategory] = useState<SimpleAnimationCategory | 'all'>('all');
  const [animatorCategory, setAnimatorCategory] = useState<SimpleAnimationCategory | 'all'>('all');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_STORAGE_KEY) !== 'true';
    } catch {
      return true;
    }
  });

  const sandboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const notify = (message: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setNotice({ message, tone });
  };

  const isDirty = useMemo(
    () => Boolean(workingAnimation && workingOriginal && animationSignature(workingAnimation) !== animationSignature(workingOriginal)),
    [workingAnimation, workingOriginal]
  );

  const isApplied = useMemo(
    () =>
      Boolean(
        workingAnimation &&
          animationsList.some(
            (animation) =>
              animation.id === workingAnimation.id &&
              animationSignature(animation) === animationSignature(workingAnimation)
          )
      ),
    [animationsList, workingAnimation]
  );

  const enabledCount = animationsList.filter((animation) => animation.enabled).length;
  const totalCount = animationsList.length;

  const filteredLibraryItems = useMemo(() => {
    const search = searchFilter.trim().toLowerCase();
    return LIBRARY_ITEMS.filter((item) => {
      const matchesCategory = libraryCategory === 'all' || item.categories.includes(libraryCategory);
      const searchable = [item.name, item.short, item.type, ...item.categories.map((category) => CATEGORY_LABEL[category])]
        .join(' ')
        .toLowerCase();
      return matchesCategory && (!search || searchable.includes(search));
    });
  }, [libraryCategory, searchFilter]);

  const libraryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: LIBRARY_ITEMS.length };
    CATEGORY_INFO.forEach((category) => {
      counts[category.id] = LIBRARY_ITEMS.filter((item) => item.categories.includes(category.id)).length;
    });
    return counts;
  }, []);

  const animatorItems = useMemo(
    () =>
      ALL_CATALOG_ITEMS.filter(
        (item) => animatorCategory === 'all' || item.categories.includes(animatorCategory)
      ),
    [animatorCategory]
  );

  const targetLabel = workingAnimation ? getTargetLabel(workingAnimation.targetComponent) : 'No target chosen';
  const previewAnimation: PreviewAnimationLike = workingAnimation || {
    type: 'fade',
    durationMs: 600,
    delayMs: 0,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    repeatCount: 1,
  };
  const typeOptions = useMemo(() => {
    const values = new Set<string>([
      ...ALL_CATALOG_ITEMS.map((item) => item.type),
      ...animationsList.map((animation) => animation.type),
    ]);
    if (workingAnimation) values.add(workingAnimation.type);
    return Array.from(values).sort((a, b) => getAnimationTypeLabel(a).localeCompare(getAnimationTypeLabel(b)));
  }, [animationsList, workingAnimation]);

  const saveAnimationsList = async (newList: StudioAnimation[], immediate = false): Promise<boolean> => {
    if (!animationConfig) {
      notify('Settings are still loading. Please try again in a moment.', 'error');
      return false;
    }
    return updateDraftSettings({ animation: { ...animationConfig, animations: newList } }, immediate);
  };

  const saveGlossyEffects = async (newList: GlossyEffectConfig[]) => {
    if (!animationConfig) return;
    await updateDraftSettings({ animation: { ...animationConfig, glossyEffects: newList } });
  };

  const setGlossyEffectsEnabled = async (enabled: boolean) => {
    if (!animationConfig) return;
    await updateDraftSettings({ animation: { ...animationConfig, glossyEffectsEnabled: enabled } });
  };

  const setAnimationsEnabled = async (enabled: boolean) => {
    if (!animationConfig) return;
    await updateDraftSettings({ animation: { ...animationConfig, animationsEnabled: enabled } });
    notify(enabled ? 'Animations are now enabled for the website.' : 'Animations are now disabled for the website.', 'info');
  };

  const saveCursorStudio = async (patch: Partial<CursorStudioConfig>) => {
    if (!animationConfig) return;
    const updatedCursor = { ...cursorStudio, ...patch };
    await updateDraftSettings({
      animation: {
        ...animationConfig,
        cursorFollower: updatedCursor.enabled,
        cursorStyle: updatedCursor.style,
        cursorColor: updatedCursor.color,
        cursorStudio: updatedCursor,
      },
    });
  };

  const beginWorking = (
    animation: StudioAnimation,
    destination: ActivePanel | null,
    step: number,
    templateKey: string | null = null
  ) => {
    setWorkingAnimation({ ...animation });
    setWorkingOriginal({ ...animation });
    setSelectedAnimationId(animation.id);
    setSelectedTemplateKey(templateKey);
    setPreviewPlaying(true);
    setReplayKey((key) => key + 1);
    setCurrentStep(step);
    if (destination) setActiveTab(destination);
  };

  const replayCard = (key: string) => {
    setCardReplayKeys((previous) => ({ ...previous, [key]: (previous[key] || 0) + 1 }));
  };

  const handlePreviewTemplate = (item: AnimationCatalogItem) => {
    const existing = findExistingTemplateAnimation(animationsList, item);
    beginWorking(existing || createStudioAnimationFromTemplate(item), null, 2, item.id);
    replayCard(item.id);
  };

  const handleUseTemplate = (item: AnimationCatalogItem) => {
    const existing = findExistingTemplateAnimation(animationsList, item);
    beginWorking(existing || createStudioAnimationFromTemplate(item), 'animator', 3, item.id);
    notify(
      existing
        ? 'This animation is already saved. Adjust it and apply when ready.'
        : 'Animation ready in the Visual Animator. Adjust it, choose a target, then apply.',
      'info'
    );
  };

  const handleSelectSaved = (animation: StudioAnimation, destination: 'animator' | 'editor') => {
    beginWorking(animation, destination, destination === 'animator' ? 3 : 4, null);
  };

  const handlePreviewSaved = (animation: StudioAnimation) => {
    beginWorking(animation, null, 2, null);
  };

  const updateWorking = <K extends keyof StudioAnimation,>(field: K, value: StudioAnimation[K]) => {
    setWorkingAnimation((previous) =>
      previous ? { ...previous, [field]: value, updatedAt: new Date().toISOString() } : previous
    );
  };

  const handleTargetChange = (target: string) => {
    setWorkingAnimation((previous) => (previous ? withTarget(previous, target) : previous));
  };

  const handleResetWorking = () => {
    if (!workingOriginal) return;
    setWorkingAnimation({ ...workingOriginal });
    setPreviewPlaying(true);
    setReplayKey((key) => key + 1);
    notify('Settings reset to the last saved version.', 'info');
  };

  const handleCancel = () => {
    const stored = workingOriginal
      ? animationsList.find((animation) => animation.id === workingOriginal.id)
      : undefined;

    if (stored) {
      setWorkingAnimation({ ...stored });
      setWorkingOriginal({ ...stored });
      setSelectedAnimationId(stored.id);
    } else {
      setWorkingAnimation(null);
      setWorkingOriginal(null);
      setSelectedAnimationId(null);
    }
    setSelectedTemplateKey(null);
    setActiveTab('library');
    setCurrentStep(1);
    notify('Edits discarded. Your saved animations were not changed.', 'info');
  };

  const commitWorking = async (immediate: boolean, message: string) => {
    if (!workingAnimation) {
      notify('Choose an animation before applying or saving.', 'info');
      return;
    }
    const now = new Date().toISOString();
    const snapshot: StudioAnimation = {
      ...workingAnimation,
      name: workingAnimation.name.trim() || 'Untitled animation',
      updatedAt: now,
    };
    const exists = animationsList.some((animation) => animation.id === snapshot.id);
    const nextList = exists
      ? animationsList.map((animation) => (animation.id === snapshot.id ? snapshot : animation))
      : [snapshot, ...animationsList];

    const saved = await saveAnimationsList(nextList, immediate);
    if (!saved) {
      notify('Changes could not be saved. Please try again.', 'error');
      return;
    }

    setWorkingAnimation({ ...snapshot });
    setWorkingOriginal({ ...snapshot });
    setSelectedAnimationId(snapshot.id);
    setCurrentStep(immediate ? 6 : 5);
    notify(message, 'success');
  };

  const handleApply = () => void commitWorking(false, 'Animation applied to the draft. Publish when you are ready for it to go live.');
  const handleSaveChanges = () => void commitWorking(true, 'Changes saved to the draft.');

  const handlePublish = async () => {
    const ok = await publishSettings();
    if (ok) {
      setCurrentStep(6);
      notify('Published. Your saved animations are now live.', 'success');
    } else {
      notify('Could not publish. Check the save message and try again.', 'error');
    }
  };

  const handleCreateAnimation = async () => {
    const created = createBlankAnimation();
    const saved = await saveAnimationsList([created, ...animationsList]);
    if (!saved) return;
    beginWorking(created, 'editor', 4, null);
    notify('New animation created. Give it a name, choose what should move, and set how it should look.', 'success');
  };

  const handleDuplicate = async (animation: StudioAnimation) => {
    const now = new Date().toISOString();
    const copy: StudioAnimation = {
      ...animation,
      id: `anim-copy-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${animation.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await saveAnimationsList([copy, ...animationsList]);
    if (!saved) return;
    beginWorking(copy, 'editor', 4, null);
    notify('Animation duplicated. You are editing the copy.', 'success');
  };

  const handleDelete = async (id: string) => {
    const target = animationsList.find((animation) => animation.id === id);
    if (!target) return;
    if (!window.confirm(`Delete "${target.name}"? This cannot be undone.`)) return;
    const nextList = animationsList.filter((animation) => animation.id !== id);
    const saved = await saveAnimationsList(nextList);
    if (!saved) return;
    if (selectedAnimationId === id || workingAnimation?.id === id) {
      setWorkingAnimation(null);
      setWorkingOriginal(null);
      setSelectedAnimationId(null);
      setSelectedTemplateKey(null);
    }
    notify('Animation deleted.', 'success');
  };

  const handleToggleEnabled = async (id: string, currentState: boolean) => {
    const nextList = animationsList.map((animation) =>
      animation.id === id ? { ...animation, enabled: !currentState } : animation
    );
    const saved = await saveAnimationsList(nextList);
    if (!saved) return;
    if (workingAnimation?.id === id) {
      setWorkingAnimation((previous) => (previous ? { ...previous, enabled: !currentState } : previous));
      setWorkingOriginal((previous) => (previous ? { ...previous, enabled: !currentState } : previous));
    }
    notify(currentState ? 'Animation turned off.' : 'Animation turned on.', 'info');
  };

  const handleTabChange = (tab: StudioTab) => {
    setActiveTab(tab);
    if (tab === 'animator') setCurrentStep(workingAnimation ? 3 : 1);
    else if (tab === 'editor') setCurrentStep(workingAnimation ? 4 : 1);
    else if (!workingAnimation) setCurrentStep(1);
  };

  const replayPreview = () => {
    setPreviewPlaying(true);
    setReplayKey((key) => key + 1);
    setCurrentStep(2);
  };

  const goToWorkflowStep = (step: number) => {
    if (step === 5) {
      handleApply();
      return;
    }
    if (step === 6) {
      handleSaveChanges();
      return;
    }
    if (step >= 4) {
      if (workingAnimation) {
        setActiveTab('editor');
        setCurrentStep(4);
      } else {
        setActiveTab('presets');
        setCurrentStep(1);
      }
      return;
    }
    if (workingAnimation) {
      setActiveTab('animator');
      setCurrentStep(step === 2 ? 2 : 3);
    } else {
      setActiveTab('presets');
      setCurrentStep(1);
    }
  };

  const dismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem(GUIDE_STORAGE_KEY, 'true');
    } catch {
      // Storage may be unavailable in private mode; dismissing still works for this visit.
    }
  };

  const fieldClass = `w-full px-3 py-2 text-xs rounded-lg border outline-none focus:border-[#35123F] focus:ring-2 focus:ring-[#35123F]/15 ${
    isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
  }`;
  const cardClass = isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800';
  const labelClass = `text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`;
  const mutedClass = isLight ? 'text-slate-500' : 'text-slate-400';
  const NoticeIcon = notice?.tone === 'error' ? AlertCircle : notice?.tone === 'info' ? Info : CheckCircle2;
  const noticeClass =
    notice?.tone === 'error'
      ? 'bg-rose-50 text-rose-800 border-rose-200'
      : notice?.tone === 'info'
      ? 'bg-sky-50 text-sky-800 border-sky-200'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';

  const renderPresets = () => (
    <div className={`space-y-4 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
      <div>
        <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Ready-made animation presets</h3>
        <p className={`mt-1 text-xs ${mutedClass}`}>
          Start with a ready-made animation. Preview it, then use it as a starting point for your own.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRESET_ITEMS.map((item) => (
          <CatalogCard
            key={item.id}
            item={item}
            isLight={isLight}
            selected={selectedTemplateKey === item.id}
            alreadyInStudio={Boolean(findExistingTemplateAnimation(animationsList, item))}
            playing={previewPlaying}
            reducedMotion={reducedMotion}
            replayKey={cardReplayKeys[item.id] || 0}
            onPreview={() => handlePreviewTemplate(item)}
            onUse={() => handleUseTemplate(item)}
          />
        ))}
      </div>
      <p className={`text-[11px] ${mutedClass}`}>
        Tip: presets are starting points. You can change the speed, strength, target, and start trigger after choosing one.
      </p>
    </div>
  );

  const renderLibrary = () => (
    <div className={`space-y-4 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Browse the animation library</h3>
          <p className={`mt-1 text-xs ${mutedClass}`}>
            Browse all available animation effects. Filter by category or search by name and purpose.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCreateAnimation()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#35123F]/20 bg-[#35123F]/5 px-3 py-2 text-xs font-semibold text-[#35123F] hover:bg-[#35123F]/10"
        >
          <Wand2 className="h-3.5 w-3.5" /> Create custom
        </button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            placeholder="Search animations by name or purpose..."
            className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs outline-none focus:border-[#35123F] focus:ring-2 focus:ring-[#35123F]/15 ${
              isLight ? 'border-slate-300 bg-slate-50 text-slate-800' : 'border-slate-700 bg-slate-900 text-white'
            }`}
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter animations by category">
          <button
            type="button"
            onClick={() => setLibraryCategory('all')}
            aria-pressed={libraryCategory === 'all'}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              libraryCategory === 'all'
                ? 'bg-[#35123F] text-white'
                : isLight
                ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            All {libraryCounts.all}
          </button>
          {CATEGORY_INFO.map((category) => (
            <button
              key={category.id}
              type="button"
              title={category.description}
              onClick={() => setLibraryCategory(category.id)}
              aria-pressed={libraryCategory === category.id}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                libraryCategory === category.id
                  ? 'bg-[#35123F] text-white'
                  : isLight
                  ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  : 'border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {category.label} {libraryCounts[category.id]}
            </button>
          ))}
        </div>

        {libraryCategory !== 'all' && (
          <p className={`text-[11px] ${mutedClass}`}>
            {CATEGORY_INFO.find((category) => category.id === libraryCategory)?.description}
          </p>
        )}
      </div>

      {filteredLibraryItems.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'}`}>
          <Search className="mx-auto h-7 w-7 text-slate-400 opacity-60" />
          <h4 className={`mt-2 text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>No animations match your search</h4>
          <p className={`mt-1 text-xs ${mutedClass}`}>Try a different word or choose “All” to see every effect.</p>
          <button
            type="button"
            onClick={() => {
              setSearchFilter('');
              setLibraryCategory('all');
            }}
            className="mt-3 rounded-lg bg-[#35123F] px-3 py-2 text-xs font-bold text-white hover:bg-[#24102D]"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredLibraryItems.map((item) => (
            <CatalogCard
              key={item.id}
              item={item}
              isLight={isLight}
              selected={selectedTemplateKey === item.id}
              alreadyInStudio={Boolean(findExistingTemplateAnimation(animationsList, item))}
              playing={previewPlaying}
              reducedMotion={reducedMotion}
              replayKey={cardReplayKeys[item.id] || 0}
              onPreview={() => handlePreviewTemplate(item)}
              onUse={() => handleUseTemplate(item)}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderAnimator = () => {
    if (!workingAnimation) {
      return (
        <div className={`rounded-2xl border p-8 text-center shadow-xs ${cardClass}`}>
          <Wand2 className={`mx-auto h-9 w-9 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
          <h3 className={`mt-3 text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Choose an animation to begin</h3>
          <p className={`mx-auto mt-1 max-w-md text-xs leading-5 ${mutedClass}`}>
            The Visual Animator shows a live preview and simple controls. Start with a preset, or browse the library for every effect.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white hover:bg-[#24102D]"
            >
              <Sparkles className="h-3.5 w-3.5" /> Browse presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold ${
                isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" /> Open library
            </button>
          </div>
        </div>
      );
    }

    const directionOptions = DIRECTION_OPTIONS.some((option) => option.value === (workingAnimation.direction || 'up'))
      ? DIRECTION_OPTIONS
      : [...DIRECTION_OPTIONS, { value: (workingAnimation.direction || 'up') as NonNullable<StudioAnimation['direction']>, label: String(workingAnimation.direction) }];
    const triggerOptions = TRIGGER_OPTIONS.some((option) => option.value === workingAnimation.trigger)
      ? TRIGGER_OPTIONS
      : [...TRIGGER_OPTIONS, { value: workingAnimation.trigger, label: getTriggerLabel(workingAnimation.trigger) }];
    const targetOptions = TARGET_OPTIONS.some((option) => option.value === workingAnimation.targetComponent)
      ? TARGET_OPTIONS
      : [...TARGET_OPTIONS, { value: workingAnimation.targetComponent || '', label: getTargetLabel(workingAnimation.targetComponent), hint: 'Custom target' }];
    const intensity = getIntensityValue(workingAnimation.intensity);
    const speed = durationToSpeed(workingAnimation.durationMs);

    return (
      <div className="space-y-5">
        <div className={`space-y-4 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>1. Choose an animation</h3>
              <p className={`mt-1 text-xs ${mutedClass}`}>Click any visual preview to try it instantly. Nothing changes on your site yet.</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`}
            >
              Browse full library <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setAnimatorCategory('all')}
              aria-pressed={animatorCategory === 'all'}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                animatorCategory === 'all' ? 'bg-[#35123F] text-white' : isLight ? 'border border-slate-200 bg-white text-slate-600' : 'border border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              All
            </button>
            {CATEGORY_INFO.map((category) => (
              <button
                key={category.id}
                type="button"
                title={category.description}
                onClick={() => setAnimatorCategory(category.id)}
                aria-pressed={animatorCategory === category.id}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  animatorCategory === category.id
                    ? 'bg-[#35123F] text-white'
                    : isLight
                    ? 'border border-slate-200 bg-white text-slate-600'
                    : 'border border-slate-700 bg-slate-900 text-slate-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {animatorItems.map((item) => {
              const selected = selectedTemplateKey === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePreviewTemplate(item)}
                  aria-pressed={selected}
                  title={`Preview ${item.name}`}
                  className={`rounded-xl border p-2 text-left transition-all ${
                    selected
                      ? 'border-[#35123F] ring-2 ring-[#35123F]/20'
                      : isLight
                      ? 'border-slate-200 bg-slate-50 hover:border-slate-300'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <MiniAnimationPreview
                    animation={item}
                    compact
                    playing={previewPlaying}
                    reducedMotion={reducedMotion}
                    replayKey={cardReplayKeys[item.id] || 0}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className={`truncate text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.name}</span>
                    <span className={`shrink-0 text-[10px] ${mutedClass}`}>{formatDuration(item.durationMs)}</span>
                  </div>
                  <p className={`mt-0.5 line-clamp-2 text-[10px] leading-4 ${mutedClass}`}>{item.short}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`space-y-4 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>2. Make it yours</h3>
            <p className={`mt-1 text-xs ${mutedClass}`}>Use plain controls to change where it goes and how it feels. The preview updates as you adjust.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelClass} title="Choose the page element this animation should affect">
                What should move?
              </span>
              <select value={workingAnimation.targetComponent || 'cards'} onChange={(event) => handleTargetChange(event.target.value)} className={fieldClass}>
                {targetOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <span className={`block text-[10px] ${mutedClass}`}>
                {targetOptions.find((option) => option.value === (workingAnimation.targetComponent || 'cards'))?.hint}
              </span>
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>When should it start?</span>
              <select
                value={workingAnimation.trigger}
                onChange={(event) => updateWorking('trigger', event.target.value as StudioAnimation['trigger'])}
                className={fieldClass}
              >
                {triggerOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className={`rounded-xl border p-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={labelClass} title="Speed changes the duration for you. Very slow is best for ambient background motion.">
                Speed
              </span>
              <span className={`text-[11px] font-semibold ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`}>
                {getSpeedLabel(speed)} · {formatDuration(workingAnimation.durationMs)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={speed}
              onChange={(event) => updateWorking('durationMs', speedToDuration(Number(event.target.value)))}
              className="mt-2 w-full cursor-pointer accent-[#35123F]"
              aria-label="Animation speed"
            />
            <div className={`flex justify-between text-[10px] ${mutedClass}`}>
              <span>Very slow</span>
              <span>Normal</span>
              <span>Very fast</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelClass}>Duration: {formatDuration(workingAnimation.durationMs)}</span>
              <input
                type="range"
                min="200"
                max="6000"
                step="50"
                value={workingAnimation.durationMs}
                onChange={(event) => updateWorking('durationMs', Number(event.target.value))}
                className="w-full cursor-pointer accent-[#35123F]"
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>Wait before it starts: {formatDuration(workingAnimation.delayMs)}</span>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={workingAnimation.delayMs}
                onChange={(event) => updateWorking('delayMs', Number(event.target.value))}
                className="w-full cursor-pointer accent-[#35123F]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelClass}>Direction</span>
              <select
                value={workingAnimation.direction || 'up'}
                disabled={isOrbitalAnimation(workingAnimation.type)}
                onChange={(event) => updateWorking('direction', event.target.value as StudioAnimation['direction'])}
                className={`${fieldClass} disabled:opacity-50`}
              >
                {directionOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {isOrbitalAnimation(workingAnimation.type) && (
                <span className={`block text-[10px] ${mutedClass}`}>Orbital motion follows its own path.</span>
              )}
            </label>

            <label className="space-y-1.5">
              <span className={labelClass}>How should it repeat?</span>
              <select
                value={getRepeatValue(workingAnimation.repeatCount)}
                onChange={(event) => updateWorking('repeatCount', getRepeatCount(event.target.value as 'once' | 'repeat' | 'continuous'))}
                className={fieldClass}
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <span className={labelClass} title="Movement strength controls how far and how boldly the element moves">
              Movement strength
            </span>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Movement strength">
              {INTENSITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  title={option.hint}
                  aria-pressed={intensity === option.value}
                  onClick={() => updateWorking('intensity', option.value)}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-bold transition-colors ${
                    intensity === option.value
                      ? 'border-[#35123F] bg-[#35123F] text-white'
                      : isLight
                      ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className={`text-[10px] ${mutedClass}`}>
              {INTENSITY_OPTIONS.find((option) => option.value === intensity)?.hint}
            </p>
          </div>

          <div className={`flex flex-wrap items-center gap-2 border-t pt-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white hover:bg-[#24102D] disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Apply animation
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Save changes
            </button>
            <button
              type="button"
              onClick={handleResetWorking}
              disabled={!isDirty}
              title="Restore the settings you started with"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
                isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                isLight ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50' : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
          <p className={`text-[10px] leading-4 ${mutedClass}`}>
            “Apply animation” stores this configuration in your draft. “Save changes” stores it immediately. Use “Publish to Live” in the header when you are ready for everyone to see it.
          </p>
        </div>
      </div>
    );
  };

  const renderSavedAnimations = () => (
    <div className={`space-y-3 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Your saved animations</h3>
          <p className={`mt-1 text-xs ${mutedClass}`}>
            These are the editable animations in your studio. Select one to preview, customize, or fine-tune it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleCreateAnimation()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-3 py-2 text-xs font-bold text-white hover:bg-[#24102D]"
        >
          <Plus className="h-3.5 w-3.5" /> New animation
        </button>
      </div>

      {animationsList.length === 0 ? (
        <div className={`rounded-xl border p-6 text-center ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'}`}>
          <Sparkles className={`mx-auto h-7 w-7 opacity-60 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
          <p className={`mt-2 text-xs ${mutedClass}`}>No saved animations yet. Use a preset or create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {animationsList.map((animation) => (
            <div
              key={animation.id}
              className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 ${
                selectedAnimationId === animation.id
                  ? 'border-[#35123F] bg-rose-50/20 ring-1 ring-[#35123F]/20'
                  : isLight
                  ? 'border-slate-200 bg-slate-50/60'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectSaved(animation, 'editor')}
                className="min-w-0 flex-1 text-left"
                title={`Edit ${animation.name}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${animation.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  <span className={`truncate text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>{animation.name}</span>
                  {selectedAnimationId === animation.id && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                </span>
                <span className={`mt-1 block truncate text-[11px] ${mutedClass}`}>
                  {getAnimationTypeLabel(animation.type)} · {getTriggerLabel(animation.trigger)} · {savedTargetLabel(animation)}
                </span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePreviewSaved(animation)}
                  title="Preview this animation"
                  aria-label={`Preview ${animation.name}`}
                  className={`rounded-lg border p-1.5 ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100' : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectSaved(animation, 'animator')}
                  title="Customize in the Visual Animator"
                  aria-label={`Customize ${animation.name}`}
                  className={`rounded-lg border p-1.5 ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100' : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleToggleEnabled(animation.id, animation.enabled)}
                  title={animation.enabled ? 'Turn this animation off' : 'Turn this animation on'}
                  aria-label={animation.enabled ? `Turn off ${animation.name}` : `Turn on ${animation.name}`}
                  className={`rounded-lg border p-1.5 ${
                    animation.enabled
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
                      : isLight
                      ? 'border-slate-200 bg-white text-slate-400'
                      : 'border-slate-700 bg-slate-900 text-slate-500'
                  }`}
                >
                  {animation.enabled ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDuplicate(animation)}
                  title="Duplicate this animation"
                  aria-label={`Duplicate ${animation.name}`}
                  className={`rounded-lg border p-1.5 ${isLight ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100' : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(animation.id)}
                  title="Delete this animation"
                  aria-label={`Delete ${animation.name}`}
                  className={`rounded-lg border p-1.5 ${isLight ? 'border-slate-200 bg-white text-rose-500 hover:bg-rose-50' : 'border-slate-700 bg-slate-900 text-rose-400 hover:bg-rose-500/10'}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEditor = () => {
    if (!workingAnimation) {
      return (
        <div className="space-y-5">
          {renderSavedAnimations()}
          <div className={`rounded-2xl border p-8 text-center shadow-xs ${cardClass}`}>
            <Sliders className={`mx-auto h-9 w-9 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
            <h3 className={`mt-3 text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Select an animation to fine-tune</h3>
            <p className={`mx-auto mt-1 max-w-md text-xs leading-5 ${mutedClass}`}>
              Choose one of your saved animations above, or start with a preset. Every setting is explained in plain language.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white hover:bg-[#24102D]"
            >
              <Sparkles className="h-3.5 w-3.5" /> Browse presets
            </button>
          </div>
        </div>
      );
    }

    const intensity = getIntensityValue(workingAnimation.intensity);
    const repeatValue = getRepeatValue(workingAnimation.repeatCount);
    const easingOptions = EASING_OPTIONS.some((option) => option.value === workingAnimation.easing)
      ? EASING_OPTIONS
      : [...EASING_OPTIONS, { value: workingAnimation.easing, label: `Custom (${workingAnimation.easing})` }];
    const directionOptions = DIRECTION_OPTIONS.some((option) => option.value === (workingAnimation.direction || 'up'))
      ? DIRECTION_OPTIONS
      : [...DIRECTION_OPTIONS, { value: (workingAnimation.direction || 'up') as NonNullable<StudioAnimation['direction']>, label: String(workingAnimation.direction) }];
    const triggerOptions = TRIGGER_OPTIONS.some((option) => option.value === workingAnimation.trigger)
      ? TRIGGER_OPTIONS
      : [...TRIGGER_OPTIONS, { value: workingAnimation.trigger, label: getTriggerLabel(workingAnimation.trigger) }];
    const targetOptions = TARGET_OPTIONS.some((option) => option.value === workingAnimation.targetComponent)
      ? TARGET_OPTIONS
      : [...TARGET_OPTIONS, { value: workingAnimation.targetComponent || '', label: getTargetLabel(workingAnimation.targetComponent), hint: 'Custom target' }];

    return (
      <div className="space-y-5">
        {renderSavedAnimations()}

        <div className={`space-y-4 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Editing: {workingAnimation.name}</h3>
              <p className={`mt-1 text-xs ${mutedClass}`}>Fine-tune settings and behavior. Technical options are tucked under Advanced Settings.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('animator')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                  isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Visual Animator
              </button>
              <button
                type="button"
                onClick={replayPreview}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Play className="h-3.5 w-3.5" /> Preview
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className={labelClass}>Animation name</span>
              <input
                type="text"
                value={workingAnimation.name}
                maxLength={80}
                onChange={(event) => updateWorking('name', event.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="space-y-1.5">
              <span className={labelClass}>One-line description</span>
              <input
                type="text"
                value={workingAnimation.description || ''}
                maxLength={140}
                onChange={(event) => updateWorking('description', event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <EditorGroup
              number="1"
              title="What should move?"
              description="Choose the page element or component this animation affects."
              isLight={isLight}
            >
              <select value={workingAnimation.targetComponent || 'cards'} onChange={(event) => handleTargetChange(event.target.value)} className={fieldClass}>
                {targetOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className={`mt-1.5 text-[10px] leading-4 ${mutedClass}`}>
                {targetOptions.find((option) => option.value === (workingAnimation.targetComponent || 'cards'))?.hint}
              </p>
              <p className={`mt-2 text-[10px] leading-4 ${mutedClass}`}>
                To attach this animation to one specific page section, open{' '}
                <Link to="/admin/pages" className="font-semibold text-[#35123F] underline dark:text-[#E9C87A]">
                  Page Builder <ExternalLink className="inline h-2.5 w-2.5" />
                </Link>{' '}
                and use Animation &amp; Motion Targeting.
              </p>
            </EditorGroup>

            <EditorGroup
              number="2"
              title="How should it move?"
              description="Pick the animation style and the direction it should travel."
              isLight={isLight}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className={labelClass}>Animation style</span>
                  <select
                    value={workingAnimation.type}
                    onChange={(event) => updateWorking('type', event.target.value as AnimationType)}
                    className={fieldClass}
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>{getAnimationTypeLabel(type)}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className={labelClass}>Direction</span>
                  <select
                    value={workingAnimation.direction || 'up'}
                    disabled={isOrbitalAnimation(workingAnimation.type)}
                    onChange={(event) => updateWorking('direction', event.target.value as StudioAnimation['direction'])}
                    className={`${fieldClass} disabled:opacity-50`}
                  >
                    {directionOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </EditorGroup>

            <EditorGroup
              number="3"
              title="How fast should it move?"
              description="Speed changes the duration for you. You can also fine-tune the exact timing."
              isLight={isLight}
            >
              <div className="space-y-3">
                <div className="rounded-lg border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <span className={labelClass}>Speed</span>
                    <span className={`text-[11px] font-semibold ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`}>
                      {getSpeedLabel(durationToSpeed(workingAnimation.durationMs))}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={durationToSpeed(workingAnimation.durationMs)}
                    onChange={(event) => updateWorking('durationMs', speedToDuration(Number(event.target.value)))}
                    className="w-full accent-[#35123F]"
                    aria-label="Speed"
                  />
                </div>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Duration: {formatDuration(workingAnimation.durationMs)}</span>
                  <input
                    type="range"
                    min="200"
                    max="6000"
                    step="50"
                    value={workingAnimation.durationMs}
                    onChange={(event) => updateWorking('durationMs', Number(event.target.value))}
                    className="w-full accent-[#35123F]"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className={labelClass}>Wait before it starts: {formatDuration(workingAnimation.delayMs)}</span>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={workingAnimation.delayMs}
                    onChange={(event) => updateWorking('delayMs', Number(event.target.value))}
                    className="w-full accent-[#35123F]"
                  />
                </label>
              </div>
            </EditorGroup>

            <EditorGroup
              number="4"
              title="When should it start?"
              description="Choose what makes the animation begin. Scroll options work when the element becomes visible."
              isLight={isLight}
            >
              <select
                value={workingAnimation.trigger}
                onChange={(event) => updateWorking('trigger', event.target.value as StudioAnimation['trigger'])}
                className={fieldClass}
              >
                {triggerOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              {workingAnimation.trigger === 'scroll' && (
                <div className="mt-3 space-y-3">
                  <label className="block space-y-1.5">
                    <span className={labelClass}>
                      How much should be visible before it starts? {Math.round((workingAnimation.scrollThreshold ?? 0.15) * 100)}%
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="1"
                      value={Math.round((workingAnimation.scrollThreshold ?? 0.15) * 100)}
                      onChange={(event) => updateWorking('scrollThreshold', Number(event.target.value) / 100)}
                      className="w-full accent-[#35123F]"
                    />
                  </label>
                  <label className={`flex items-center gap-2 text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    <input
                      type="checkbox"
                      checked={workingAnimation.scrollOnce !== false}
                      onChange={(event) => updateWorking('scrollOnce', event.target.checked)}
                      className="h-4 w-4 accent-[#35123F]"
                    />
                    Only play once (recommended)
                  </label>
                </div>
              )}
            </EditorGroup>

            <EditorGroup
              number="5"
              title="How strong should it look?"
              description="Movement strength controls how far and how boldly the element moves."
              isLight={isLight}
            >
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Movement strength">
                {INTENSITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    title={option.hint}
                    aria-pressed={intensity === option.value}
                    onClick={() => updateWorking('intensity', option.value)}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-bold ${
                      intensity === option.value
                        ? 'border-[#35123F] bg-[#35123F] text-white'
                        : isLight
                        ? 'border-slate-200 bg-white text-slate-600'
                        : 'border-slate-700 bg-slate-900 text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className={`mt-1.5 text-[10px] ${mutedClass}`}>
                {INTENSITY_OPTIONS.find((option) => option.value === intensity)?.hint}
              </p>
            </EditorGroup>

            <EditorGroup
              number="6"
              title="How should it repeat?"
              description="Use continuous motion for ambient decoration, or play once for entrances."
              isLight={isLight}
            >
              <select
                value={repeatValue}
                onChange={(event) => updateWorking('repeatCount', getRepeatCount(event.target.value as 'once' | 'repeat' | 'continuous'))}
                className={fieldClass}
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </EditorGroup>
          </div>

          <details className={`rounded-xl border p-4 ${isLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800 bg-slate-900/40'}`}>
            <summary className={`cursor-pointer text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              Advanced Settings <span className={`ml-1 font-normal ${mutedClass}`}>— optional technical controls</span>
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className={labelClass}>Easing curve</span>
                <select
                  value={workingAnimation.easing}
                  onChange={(event) => updateWorking('easing', event.target.value)}
                  className={fieldClass}
                >
                  {easingOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Target scope</span>
                <select
                  value={workingAnimation.targetScope}
                  onChange={(event) => updateWorking('targetScope', event.target.value as StudioAnimation['targetScope'])}
                  className={fieldClass}
                >
                  <option value="component">Component</option>
                  <option value="section">Section</option>
                  <option value="page">Page</option>
                  <option value="global">Whole website</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Section ID (optional)</span>
                <input
                  type="text"
                  value={workingAnimation.targetSectionId || ''}
                  onChange={(event) => updateWorking('targetSectionId', event.target.value || undefined)}
                  placeholder="e.g. home-hero"
                  className={fieldClass}
                />
              </label>
              <label className="space-y-1.5">
                <span className={labelClass}>Page slug (optional)</span>
                <input
                  type="text"
                  value={workingAnimation.targetPage || ''}
                  onChange={(event) => updateWorking('targetPage', event.target.value || undefined)}
                  placeholder="e.g. home"
                  className={fieldClass}
                />
              </label>
              {workingAnimation.type === 'stagger' && (
                <label className="space-y-1.5">
                  <span className={labelClass}>Time between items (ms)</span>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="10"
                    value={workingAnimation.staggerIntervalMs ?? 120}
                    onChange={(event) => updateWorking('staggerIntervalMs', Number(event.target.value))}
                    className={fieldClass}
                  />
                </label>
              )}
              <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${isLight ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                <span>
                  Respect reduced-motion settings
                  <span className={`mt-0.5 block text-[10px] ${mutedClass}`}>Automatically calms motion for visitors who ask for it.</span>
                </span>
                <input
                  type="checkbox"
                  checked={workingAnimation.respectReducedMotion !== false}
                  onChange={(event) => updateWorking('respectReducedMotion', event.target.checked)}
                  className="h-4 w-4 accent-[#35123F]"
                />
              </label>
              <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs ${isLight ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                <span>
                  Animation is enabled
                  <span className={`mt-0.5 block text-[10px] ${mutedClass}`}>Turn this off to keep the settings but stop using it.</span>
                </span>
                <input
                  type="checkbox"
                  checked={workingAnimation.enabled}
                  onChange={(event) => updateWorking('enabled', event.target.checked)}
                  className="h-4 w-4 accent-[#35123F]"
                />
              </label>
            </div>
          </details>

          <div className={`flex flex-wrap items-center gap-2 border-t pt-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white hover:bg-[#24102D] disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Apply animation
            </button>
            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Save changes
            </button>
            <button
              type="button"
              onClick={handleResetWorking}
              disabled={!isDirty}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
                isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-200'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                isLight ? 'border-slate-300 bg-white text-slate-600' : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCursorPanel = () => (
    <CursorStudioPanel
      cursorStudio={cursorStudio}
      isLight={isLight}
      onChange={(patch) => void saveCursorStudio(patch)}
      onBrowseMedia={() => setShowMediaPicker(true)}
    />
  );

  const renderPreviewPanel = () => (
    <div className={`space-y-4 rounded-2xl border p-5 shadow-xs ${cardClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-[#D5A13C]" />
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>Live preview</h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800" role="group" aria-label="Preview size">
          {([
            { id: 'desktop', icon: Monitor, label: 'Desktop preview' },
            { id: 'tablet', icon: Tablet, label: 'Tablet preview' },
            { id: 'mobile', icon: Smartphone, label: 'Mobile preview' },
          ] as const).map((device) => {
            const Icon = device.icon;
            return (
              <button
                key={device.id}
                type="button"
                onClick={() => setPreviewDevice(device.id)}
                aria-pressed={previewDevice === device.id}
                aria-label={device.label}
                title={device.label}
                className={`rounded p-1.5 ${previewDevice === device.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400'}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-xl border p-3 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/40'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {activeTab === 'cursor' ? 'Cursor preview' : 'Selected animation'}
          </span>
          {(isDirty || (workingAnimation && !isApplied)) && activeTab !== 'cursor' && (
            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              {isDirty ? 'Unsaved changes' : 'Not applied yet'}
            </span>
          )}
        </div>
        <p className={`mt-1 text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          {activeTab === 'cursor' ? 'Move your pointer inside the preview' : workingAnimation?.name || 'Choose an animation to preview'}
        </p>
        {activeTab !== 'cursor' && (
          <p className={`mt-0.5 text-[11px] ${mutedClass}`}>
            Target: {targetLabel} · {getTriggerLabel(workingAnimation?.trigger)}
          </p>
        )}
      </div>

      {activeTab === 'cursor' ? (
        <div
          ref={sandboxRef}
          key={`cursor-${replayKey}`}
          style={{
            maxWidth: previewDevice === 'mobile' ? '320px' : previewDevice === 'tablet' ? '440px' : '100%',
          }}
          className="cms-public-preview relative mx-auto flex min-h-[320px] select-none flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-[#FAF7F2] p-6 dark:border-slate-800 dark:bg-[#0B0D17]"
        >
          <CursorFollower isSandbox sandboxContainerRef={sandboxRef} customConfig={cursorStudio} />
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D5A13C]">Cursor Studio</span>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#161B2E]">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Azaroth Enterprise Platform</h4>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Move your cursor inside this area to test the shape, size, smoothing, hover feedback, and click response.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button" className="cursor-hover-trigger rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs">
                Hover target A
              </button>
              <button type="button" className="cursor-hover-trigger rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Hover target B
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-4 text-[11px] text-slate-400 dark:border-slate-800/60">
            <span>Cursor: {cursorStudio.style}</span>
            <button type="button" onClick={replayPreview} className="font-semibold text-[#35123F] hover:underline dark:text-[#E9C87A]">
              Replay preview
            </button>
          </div>
        </div>
      ) : (
        <TargetStage
          animation={previewAnimation}
          targetComponent={workingAnimation?.targetComponent || 'cards'}
          playing={previewPlaying}
          reducedMotion={reducedMotion}
          replayKey={replayKey}
          className={previewDevice === 'mobile' ? 'max-w-[320px]' : previewDevice === 'tablet' ? 'max-w-[440px]' : ''}
        />
      )}

      {activeTab !== 'cursor' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewPlaying(true)}
              disabled={previewPlaying}
              title="Start the preview"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" /> Start
            </button>
            <button
              type="button"
              onClick={() => setPreviewPlaying(false)}
              disabled={!previewPlaying}
              title="Pause the preview"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50 ${
                isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-200'
              }`}
            >
              <Pause className="h-3.5 w-3.5" /> Pause
            </button>
            <button
              type="button"
              onClick={replayPreview}
              title="Replay from the beginning"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${
                isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-200'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replay
            </button>
            <button
              type="button"
              onClick={() => {
                setReplayKey((key) => key + 1);
                setPreviewPlaying(true);
                notify('Preview reset to the beginning.', 'info');
              }}
              title="Reset the preview without changing your settings"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${
                isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-200'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset preview
            </button>
          </div>
          <p className={`text-[10px] leading-4 ${mutedClass}`}>
            {reducedMotion
              ? 'Your device asks for reduced motion, so previews are shown without movement. The live website will also respect this preference when enabled.'
              : 'Hover effects are shown automatically in the preview so you can judge the result before applying.'}
          </p>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className={`flex flex-col gap-4 rounded-2xl border p-5 shadow-xs xl:flex-row xl:items-start xl:justify-between ${cardClass}`}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-xl bg-[#35123F]/10 p-2.5 text-[#35123F]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>Animation Studio</h2>
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                No code needed
              </span>
            </div>
            <p className={`mt-1 max-w-2xl text-xs leading-5 ${mutedClass}`}>
              Add motion to your website in a few simple steps. Choose a ready-made animation, preview it, customize it, choose a target, and apply it.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className={`inline-flex items-center gap-2 text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <input
                  type="checkbox"
                  checked={animationsEnabled}
                  onChange={(event) => void setAnimationsEnabled(event.target.checked)}
                  className="h-4 w-4 accent-[#35123F]"
                />
                Animations are on for the website
              </label>
              <span className={`text-[11px] ${mutedClass}`}>{enabledCount} of {totalCount} saved animations active</span>
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`}
              >
                <HelpCircle className="h-3.5 w-3.5" /> Show quick guide
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {notice && (
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium animate-in fade-in ${noticeClass}`}>
              <NoticeIcon className="h-3.5 w-3.5" />
              <span>{notice.message}</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={isSaving}
            title="Make your saved animation changes live on the website"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-colors hover:bg-[#24102D] disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Publish to Live'}</span>
          </button>
        </div>
      </div>

      {showGuide && (
        <div className={`rounded-2xl border p-5 shadow-xs ${isLight ? 'border-[#D5A13C]/40 bg-gradient-to-br from-amber-50/70 to-white' : 'border-[#D5A13C]/30 bg-gradient-to-br from-[#2A1E12]/50 to-[#131624]'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <BookOpen className={`mt-0.5 h-5 w-5 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
              <div>
                <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>First time here? Follow four simple steps.</h3>
                <p className={`mt-1 text-xs ${mutedClass}`}>The guide is optional. You can dismiss it and open it again from the header.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissGuide}
              title="Dismiss the quick guide"
              className={`rounded-lg border p-1.5 ${isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-700 bg-slate-900 text-slate-400'}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: '1. Choose', text: 'Pick a preset or a library effect.', tab: 'presets' as StudioTab, icon: Sparkles },
              { title: '2. Preview', text: 'Watch it play in the live preview.', tab: 'animator' as StudioTab, icon: Eye },
              { title: '3. Customize', text: 'Adjust speed, strength, and direction.', tab: 'animator' as StudioTab, icon: Sliders },
              { title: '4. Apply and save', text: 'Choose a target, apply, then publish.', tab: 'editor' as StudioTab, icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleTabChange(item.tab)}
                  className={`rounded-xl border p-3 text-left transition-colors ${isLight ? 'border-slate-200 bg-white/80 hover:bg-white' : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900'}`}
                >
                  <Icon className={`h-4 w-4 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
                  <span className={`mt-2 block text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.title}</span>
                  <span className={`mt-0.5 block text-[10px] leading-4 ${mutedClass}`}>{item.text}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              dismissGuide();
              setActiveTab('presets');
              setCurrentStep(1);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-4 py-2 text-xs font-bold text-white hover:bg-[#24102D]"
          >
            <Sparkles className="h-3.5 w-3.5" /> Start with presets
          </button>
        </div>
      )}

      <div role="tablist" aria-label="Animation Studio sections" className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {STUDIO_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`studio-panel-${tab.id}`}
              title={tab.description}
              onClick={() => handleTabChange(tab.id)}
              className={`rounded-xl border p-3 text-left transition-all ${
                active
                  ? 'border-[#35123F] bg-[#35123F] text-white shadow-sm'
                  : isLight
                  ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  : 'border-slate-800 bg-[#131624] text-slate-300 hover:border-slate-700 hover:bg-[#161B2E]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-bold">{tab.label}</span>
              </span>
              <span className={`mt-1 block text-[11px] leading-4 ${active ? 'text-white/75' : mutedClass}`}>{tab.description}</span>
            </button>
          );
        })}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${cardClass}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`mr-1 text-[10px] font-bold uppercase tracking-wider ${mutedClass}`}>More studio tools</span>
          <button
            type="button"
            onClick={() => setActiveTab('cursor')}
            aria-pressed={activeTab === 'cursor'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
              activeTab === 'cursor' ? 'bg-[#35123F] text-white' : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MousePointer className="h-3.5 w-3.5" /> Cursor Studio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('glossy')}
            aria-pressed={activeTab === 'glossy'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
              activeTab === 'glossy' ? 'bg-[#35123F] text-white' : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Palette className="h-3.5 w-3.5" /> Glossy Effects
          </button>
        </div>
        {(activeTab === 'cursor' || activeTab === 'glossy') && (
          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              setCurrentStep(1);
            }}
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`}
          >
            <ArrowLeft className="h-3 w-3" /> Back to animations
          </button>
        )}
      </div>

      <div className={`rounded-xl border p-3 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListChecks className={`h-4 w-4 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
            <span className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Your animation journey</span>
          </div>
          <span className={`text-[11px] ${mutedClass}`}>
            Step {currentStep} of 6 · {WORKFLOW_STEPS[currentStep - 1]}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
          {WORKFLOW_STEPS.map((label, index) => {
            const step = index + 1;
            const done = step < currentStep;
            const active = step === currentStep;
            return (
              <React.Fragment key={label}>
                {index > 0 && <ChevronRight className={`h-3 w-3 shrink-0 ${mutedClass}`} />}
                <button
                  type="button"
                  onClick={() => goToWorkflowStep(step)}
                  disabled={!workingAnimation && (step === 5 || step === 6)}
                  aria-current={active ? 'step' : undefined}
                  title={step === 5 ? 'Apply this animation' : step === 6 ? 'Save changes' : `Go to ${label}`}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? 'bg-[#35123F] text-white'
                      : done
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : isLight
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${active ? 'bg-white/20' : done ? 'bg-emerald-500 text-white' : isLight ? 'bg-white' : 'bg-slate-900'}`}>
                    {done ? <Check className="h-2.5 w-2.5" /> : step}
                  </span>
                  {label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 shadow-xs ${cardClass}`}>
        {workingAnimation ? (
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isLight ? 'bg-[#35123F]/8 text-[#35123F]' : 'bg-white/10 text-slate-300'}`}>
                  Selected animation
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${isApplied ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                  {isApplied ? 'Applied to draft' : 'Not applied yet'}
                </span>
                {isDirty && (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
                    Unsaved changes
                  </span>
                )}
                {!workingAnimation.enabled && (
                  <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Turned off
                  </span>
                )}
              </div>
              <h3 className={`mt-1 truncate text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{workingAnimation.name}</h3>
              <p className={`mt-0.5 text-[11px] ${mutedClass}`}>
                {getAnimationTypeLabel(workingAnimation.type)} · {getTriggerLabel(workingAnimation.trigger)} · Target: {targetLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={replayPreview}
                title="Preview this animation"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                  isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Play className="h-3 w-3 text-emerald-500" /> Preview
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('animator')}
                title="Open the Visual Animator"
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                  isLight ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Wand2 className="h-3 w-3" /> Customize
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('editor')}
                title="Open the Animation Editor"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#24102D]"
              >
                <Sliders className="h-3 w-3" /> Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No animation selected yet</h3>
              <p className={`mt-0.5 text-[11px] ${mutedClass}`}>Pick a ready-made preset or browse the library to begin. Your selection is kept as you move between sections.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleTabChange('presets')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#35123F] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#24102D]"
              >
                <Sparkles className="h-3 w-3" /> Browse presets
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('library')}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                  isLight ? 'border-slate-300 bg-white text-slate-700' : 'border-slate-700 bg-slate-900 text-slate-200'
                }`}
              >
                <Layers className="h-3 w-3" /> Open library
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div
          id={`studio-panel-${activeTab}`}
          role="tabpanel"
          className={`${activeTab === 'glossy' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-5`}
        >
          {activeTab === 'presets' && renderPresets()}
          {activeTab === 'library' && renderLibrary()}
          {activeTab === 'animator' && renderAnimator()}
          {activeTab === 'editor' && renderEditor()}
          {activeTab === 'cursor' && renderCursorPanel()}
          {activeTab === 'glossy' && (
            <GlossyEffectsPanel
              effects={glossyEffects}
              onChange={saveGlossyEffects}
              isLight={isLight}
              previewDevice={previewDevice}
              onPreviewDevice={setPreviewDevice}
              effectsEnabled={glossyEffectsEnabled}
              onEffectsEnabledChange={setGlossyEffectsEnabled}
            />
          )}
        </div>

        {activeTab !== 'glossy' && (
          <div className="space-y-4 lg:sticky lg:top-4 lg:col-span-5">
            {renderPreviewPanel()}
            {activeTab !== 'cursor' && (
              <div className={`rounded-xl border p-4 ${cardClass}`}>
                <div className="flex items-start gap-2">
                  <Info className={`mt-0.5 h-4 w-4 shrink-0 ${isLight ? 'text-[#35123F]' : 'text-[#E9C87A]'}`} />
                  <div>
                    <h4 className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>What happens next?</h4>
                    <p className={`mt-1 text-[11px] leading-4 ${mutedClass}`}>
                      Apply stores your animation in the draft. Publish makes it live. Nothing changes for visitors until you publish.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold">
                      <span className={`rounded-full px-2 py-0.5 ${isApplied ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'}`}>
                        {isApplied ? 'In draft' : 'Not applied'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 ${isDirty ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-500/10 text-slate-500'}`}>
                        {isDirty ? 'Unsaved edits' : 'Settings saved'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        filter="image"
        title="Select a custom cursor image"
        onSelect={(item) => {
          void saveCursorStudio({
            customImageUrl: item.url,
            customImageAlt: item.altText || item.originalName,
            style: 'custom-image',
          });
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
};
