import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Plus,
  Trash2,
  Check,
  MessageSquare,
  Bot,
  Save,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Palette,
  Eye,
  RotateCcw,
  ChevronRight,
  Send,
  User,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import type { ChatbotFaq, ChatbotColors } from '../../types';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { uploadAdminMedia } from '../../utils/mediaUpload';

export const ChatbotFaqManager: React.FC = () => {
  const { editorSettings, updateDraftSettings, publishSettings, isSaving } = useTheme();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<ChatbotFaq> | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'persona' | 'appearance' | 'faqs'>('appearance');

  const faqs = editorSettings?.faqs || [];
  const botCfg = editorSettings?.chatbot || {
    botName: 'Azaroth Solutions Advisor',
    statusText: 'Rule-based Enterprise Assistant',
    welcomeMessage: 'Welcome to Azaroth Tech-Hive. How can I assist with our enterprise platforms today?',
    avatarUrl: '',
    triggerLabel: 'Azaroth Solutions Advisor',
    placeholderText: 'Ask a technical or platform question...',
    enabled: true,
  };

  const themePrimary = editorSettings?.theme?.primary || '#35123F';
  const themeAccent = editorSettings?.theme?.accent || '#D5A13C';

  const colors: ChatbotColors = botCfg.colors || {
    useCustomColors: false,
    windowBg: '#FFFFFF',
    headerBg: themePrimary,
    headerText: '#FFFFFF',
    botBubbleBg: '#F8FAFC',
    botBubbleText: '#1E293B',
    userBubbleBg: themePrimary,
    userBubbleText: '#FFFFFF',
    launcherBg: themePrimary,
    launcherIconColor: '#FFFFFF',
    launcherGradientEnabled: false,
    launcherGradientEnd: themeAccent,
    launcherGradientAngle: 135,
    actionButtonBg: '#FFFFFF',
    actionButtonText: themePrimary,
    actionButtonBorder: themePrimary,
    sendButtonBg: themePrimary,
    sendButtonText: '#FFFFFF',
  };

  const handleUpdateBotCfg = async (field: string, value: any): Promise<boolean> => {
    const updated = {
      ...botCfg,
      [field]: value,
    };
    const ok = await updateDraftSettings({ chatbot: updated });
    if (!ok) {
      setFeedbackIsError(true);
      setFeedback('Chatbot settings could not be saved');
      setTimeout(() => setFeedback(null), 3000);
      return false;
    }
    setFeedbackIsError(false);
    setFeedback('Chatbot settings updated in draft');
    setTimeout(() => setFeedback(null), 2000);
    return true;
  };

  const handleUpdateColors = async (field: keyof ChatbotColors, value: any) => {
    const updatedColors = {
      ...colors,
      [field]: value,
    };
    await handleUpdateBotCfg('colors', updatedColors);
  };

  const applyColorPreset = async (preset: Partial<ChatbotColors>) => {
    const updatedColors = {
      ...colors,
      useCustomColors: true,
      launcherGradientEnabled: false,
      ...preset,
    };
    const ok = await handleUpdateBotCfg('colors', updatedColors);
    if (!ok) return;
    setFeedbackIsError(false);
    setFeedback('Color preset applied');
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const result = await uploadAdminMedia(file, { altText: 'Chatbot Avatar' });
      if (result.ok) {
        await handleUpdateBotCfg('avatarUrl', result.media.url);
        setFeedbackIsError(false);
        setFeedback('Avatar PNG uploaded successfully');
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
      }
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveFaq = async (faqToSave: Partial<ChatbotFaq>) => {
    let updated: ChatbotFaq[];
    if (faqToSave.id) {
      updated = faqs.map((f) => (f.id === faqToSave.id ? ({ ...f, ...faqToSave } as ChatbotFaq) : f));
    } else {
      const newFaq: ChatbotFaq = {
        id: 'faq-' + Date.now(),
        question: faqToSave.question || 'New Question',
        answer: faqToSave.answer || 'Detailed answer.',
        category: faqToSave.category || 'General',
        keywords: faqToSave.keywords || [],
      };
      updated = [...faqs, newFaq];
    }

    const ok = await updateDraftSettings({ faqs: updated });
    if (!ok) {
      setFeedbackIsError(true);
      setFeedback('FAQ could not be saved');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setEditingFaq(null);
    setFeedbackIsError(false);
    setFeedback('Knowledge base updated in draft');
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDeleteFaq = async (id: string) => {
    const target = faqs.find((f) => f.id === id);
    if (
      !target ||
      !confirm(
        `Delete the FAQ "${target.question}" from the knowledge base? This affects the published chatbot once you publish.`
      )
    ) {
      return;
    }
    const updated = faqs.filter((f) => f.id !== id);
    const ok = await updateDraftSettings({ faqs: updated });
    if (!ok) {
      setFeedbackIsError(true);
      setFeedback('FAQ could not be removed');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setFeedbackIsError(false);
    setFeedback('FAQ removed from draft');
    setTimeout(() => setFeedback(null), 2000);
  };

  // Resolved preview colors
  const previewHeaderBg = colors.useCustomColors && colors.headerBg ? colors.headerBg : themePrimary;
  const previewHeaderText = colors.useCustomColors && colors.headerText ? colors.headerText : '#FFFFFF';
  const previewWindowBg = colors.useCustomColors && colors.windowBg ? colors.windowBg : '#FFFFFF';
  const previewBotBubbleBg = colors.useCustomColors && colors.botBubbleBg ? colors.botBubbleBg : '#F8FAFC';
  const previewBotBubbleText = colors.useCustomColors && colors.botBubbleText ? colors.botBubbleText : '#1E293B';
  const previewUserBubbleBg = colors.useCustomColors && colors.userBubbleBg ? colors.userBubbleBg : themePrimary;
  const previewUserBubbleText = colors.useCustomColors && colors.userBubbleText ? colors.userBubbleText : '#FFFFFF';
  const previewLauncherBg = colors.useCustomColors
    ? colors.launcherGradientEnabled && colors.launcherGradientEnd
      ? `linear-gradient(${colors.launcherGradientAngle ?? 135}deg, ${colors.launcherBg || themePrimary} 0%, ${colors.launcherGradientEnd} 100%)`
      : (colors.launcherBg || themePrimary)
    : `linear-gradient(135deg, ${themePrimary} 0%, ${themeAccent} 100%)`;
  const previewActionBg = colors.useCustomColors && colors.actionButtonBg ? colors.actionButtonBg : '#FFFFFF';
  const previewActionText = colors.useCustomColors && colors.actionButtonText ? colors.actionButtonText : themePrimary;
  const previewActionBorder = colors.useCustomColors && colors.actionButtonBorder ? colors.actionButtonBorder : themePrimary;
  const previewSendBg = colors.useCustomColors && colors.sendButtonBg ? colors.sendButtonBg : themePrimary;
  const previewSendText = colors.useCustomColors && colors.sendButtonText ? colors.sendButtonText : '#FFFFFF';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#35123F]/10 text-[#35123F] rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chatbot & FAQ Studio</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize colors, persona, and technical knowledge base with real-time website synchronization.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {feedback && (
            <span
              className={`text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border animate-in fade-in ${
                feedbackIsError
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {feedbackIsError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {feedback}
            </span>
          )}

          <button
            onClick={async () => {
              const ok = await publishSettings();
              if (ok) {
                setFeedbackIsError(false);
                setFeedback('Chatbot settings published live');
                setTimeout(() => setFeedback(null), 2500);
              } else {
                setFeedbackIsError(true);
                setFeedback('Publish failed - see error banner');
                setTimeout(() => setFeedback(null), 3000);
              }
            }}
            disabled={isSaving}
            className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-xl">
        {[
          { id: 'appearance', label: 'Appearance & Colors', icon: Palette },
          { id: 'persona', label: 'Identity & Persona', icon: Bot },
          { id: 'faqs', label: 'Technical FAQs', icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                active
                  ? 'bg-white text-[#35123F] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPEARANCE & COLORS */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Color Controls */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Color Customization Mode</h3>
                <p className="text-xs text-slate-500">
                  Inherit global theme tokens or specify independent custom colors for the chatbot interface.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleUpdateColors('useCustomColors', false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !colors.useCustomColors
                      ? 'bg-white text-[#35123F] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inherit Theme
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateColors('useCustomColors', true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    colors.useCustomColors
                      ? 'bg-[#35123F] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Custom Colors
                </button>
              </div>
            </div>

            {/* Presets */}
            {colors.useCustomColors && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Quick Color Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      name: 'Classic',
                      preset: {
                        windowBg: '#FFFFFF',
                        headerBg: '#35123F',
                        headerText: '#FFFFFF',
                        botBubbleBg: '#F8FAFC',
                        botBubbleText: '#1E293B',
                        userBubbleBg: '#35123F',
                        userBubbleText: '#FFFFFF',
                        launcherBg: '#35123F',
                        actionButtonBg: '#FFFFFF',
                        actionButtonText: '#35123F',
                        actionButtonBorder: '#35123F',
                        sendButtonBg: '#35123F',
                      },
                    },
                    {
                      name: 'Midnight Dark',
                      preset: {
                        windowBg: '#111827',
                        headerBg: '#1F2937',
                        headerText: '#FAF7F2',
                        botBubbleBg: '#1F2937',
                        botBubbleText: '#F3F4F6',
                        userBubbleBg: '#3B82F6',
                        userBubbleText: '#FFFFFF',
                        launcherBg: '#1F2937',
                        actionButtonBg: '#1F2937',
                        actionButtonText: '#60A5FA',
                        actionButtonBorder: '#374151',
                        sendButtonBg: '#3B82F6',
                      },
                    },
                    {
                      name: 'Corporate Slate',
                      preset: {
                        windowBg: '#FFFFFF',
                        headerBg: '#1E293B',
                        headerText: '#FFFFFF',
                        botBubbleBg: '#F1F5F9',
                        botBubbleText: '#0F172A',
                        userBubbleBg: '#2563EB',
                        userBubbleText: '#FFFFFF',
                        launcherBg: '#1E293B',
                        actionButtonBg: '#FFFFFF',
                        actionButtonText: '#2563EB',
                        actionButtonBorder: '#CBD5E1',
                        sendButtonBg: '#2563EB',
                      },
                    },
                    {
                      name: 'Teal Elegance',
                      preset: {
                        windowBg: '#FFFFFF',
                        headerBg: '#0D9488',
                        headerText: '#FFFFFF',
                        botBubbleBg: '#F0FDFA',
                        botBubbleText: '#134E4A',
                        userBubbleBg: '#0D9488',
                        userBubbleText: '#FFFFFF',
                        launcherBg: '#0D9488',
                        actionButtonBg: '#FFFFFF',
                        actionButtonText: '#0D9488',
                        actionButtonBorder: '#99F6E4',
                        sendButtonBg: '#0D9488',
                      },
                    },
                  ].map((p, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => applyColorPreset(p.preset)}
                      className="p-2 border border-slate-200 hover:border-slate-400 bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 text-center cursor-pointer transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Granular Color Pickers */}
            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Interface Color Controls
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Header Background */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Header Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.headerBg || themePrimary}
                      onChange={(e) => handleUpdateColors('headerBg', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.headerBg || themePrimary}
                      onChange={(e) => handleUpdateColors('headerBg', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Header Text */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Header Text & Icons</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.headerText || '#FFFFFF'}
                      onChange={(e) => handleUpdateColors('headerText', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.headerText || '#FFFFFF'}
                      onChange={(e) => handleUpdateColors('headerText', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Window Background */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Chat Window Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.windowBg || '#FFFFFF'}
                      onChange={(e) => handleUpdateColors('windowBg', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.windowBg || '#FFFFFF'}
                      onChange={(e) => handleUpdateColors('windowBg', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Launcher Button Background */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 block">Floating Launcher Button</span>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!colors.launcherGradientEnabled}
                        disabled={!colors.useCustomColors}
                        onChange={(e) => handleUpdateColors('launcherGradientEnabled', e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                      Gradient
                    </label>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 block">
                      {colors.launcherGradientEnabled ? 'Gradient Start Color' : 'Background Color'}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        disabled={!colors.useCustomColors}
                        value={colors.launcherBg || themePrimary}
                        onChange={(e) => handleUpdateColors('launcherBg', e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                      />
                      <input
                        type="text"
                        disabled={!colors.useCustomColors}
                        value={colors.launcherBg || themePrimary}
                        onChange={(e) => handleUpdateColors('launcherBg', e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                  {colors.launcherGradientEnabled && (
                    <>
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-500 block">Gradient End Color</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            disabled={!colors.useCustomColors}
                            value={colors.launcherGradientEnd || themeAccent}
                            onChange={(e) => handleUpdateColors('launcherGradientEnd', e.target.value)}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                          />
                          <input
                            type="text"
                            disabled={!colors.useCustomColors}
                            value={colors.launcherGradientEnd || themeAccent}
                            onChange={(e) => handleUpdateColors('launcherGradientEnd', e.target.value)}
                            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">Gradient Angle (0-360°)</span>
                        <input
                          type="number"
                          min={0}
                          max={360}
                          disabled={!colors.useCustomColors}
                          value={colors.launcherGradientAngle ?? 135}
                          onChange={(e) => handleUpdateColors('launcherGradientAngle', Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-right disabled:bg-slate-100"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Launcher Icon Color */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Launcher Icon Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.launcherIconColor || '#FFFFFF'}
                      onChange={(e) => handleUpdateColors('launcherIconColor', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.launcherIconColor || '#FFFFFF'}
                      onChange={(e) => handleUpdateColors('launcherIconColor', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Bot Message Bubble */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Bot Message Bubble Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.botBubbleBg || '#F8FAFC'}
                      onChange={(e) => handleUpdateColors('botBubbleBg', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.botBubbleBg || '#F8FAFC'}
                      onChange={(e) => handleUpdateColors('botBubbleBg', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Bot Message Text */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Bot Message Text Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.botBubbleText || '#1E293B'}
                      onChange={(e) => handleUpdateColors('botBubbleText', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.botBubbleText || '#1E293B'}
                      onChange={(e) => handleUpdateColors('botBubbleText', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* User Message Bubble */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">User Message Bubble Background</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.userBubbleBg || themePrimary}
                      onChange={(e) => handleUpdateColors('userBubbleBg', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.userBubbleBg || themePrimary}
                      onChange={(e) => handleUpdateColors('userBubbleBg', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Send Button Background */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="font-bold text-slate-700 block">Send Message Button Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!colors.useCustomColors}
                      value={colors.sendButtonBg || themePrimary}
                      onChange={(e) => handleUpdateColors('sendButtonBg', e.target.value)}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer disabled:opacity-40"
                    />
                    <input
                      type="text"
                      disabled={!colors.useCustomColors}
                      value={colors.sendButtonBg || themePrimary}
                      onChange={(e) => handleUpdateColors('sendButtonBg', e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono uppercase text-xs disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Chatbot Preview Sandbox */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Eye className="w-4 h-4 text-[#35123F]" />
                Live Chatbot Preview
              </span>
              <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono">
                {colors.useCustomColors ? 'Custom Mode' : 'Inherited Theme'}
              </span>
            </div>

            {/* Mock Chat Window */}
            <div
              className="cms-public-preview rounded-2xl border border-slate-300 shadow-xl overflow-hidden flex flex-col h-[520px]"
              style={{ backgroundColor: previewWindowBg }}
            >
              {/* Header */}
              <div
                className="px-4 py-3 flex items-center justify-between shadow-xs"
                style={{ backgroundColor: previewHeaderBg, color: previewHeaderText }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                    {botCfg.avatarUrl ? (
                      <img src={botCfg.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      'A'
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight" style={{ color: previewHeaderText }}>
                      {botCfg.botName || 'Solutions Advisor'}
                    </h4>
                    <p className="text-[10px] opacity-80" style={{ color: previewHeaderText }}>
                      {botCfg.statusText || 'Enterprise Assistant'}
                    </p>
                  </div>
                </div>
                <button type="button" className="opacity-70 hover:opacity-100 text-xs">✕</button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs">
                {/* Bot greeting */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <div
                    className="p-3 rounded-2xl rounded-bl-none shadow-2xs border border-slate-200/50"
                    style={{ backgroundColor: previewBotBubbleBg, color: previewBotBubbleText }}
                  >
                    {botCfg.welcomeMessage || 'Welcome to Azaroth Tech-Hive. How can I assist you today?'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {['Explore Platforms', 'Technical Architecture', 'Speak with an Architect'].map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      type="button"
                      style={{
                        backgroundColor: previewActionBg,
                        color: previewActionText,
                        borderColor: previewActionBorder,
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium border rounded-lg shadow-2xs"
                    >
                      {btn}
                    </button>
                  ))}
                </div>

                {/* User message */}
                <div className="flex flex-col items-end">
                  <div
                    className="p-3 rounded-2xl rounded-br-none shadow-xs text-xs font-medium"
                    style={{ backgroundColor: previewUserBubbleBg, color: previewUserBubbleText }}
                  >
                    We are evaluating high-throughput commerce architectures.
                  </div>
                </div>

                {/* Bot reply */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <div
                    className="p-3 rounded-2xl rounded-bl-none shadow-2xs border border-slate-200/50"
                    style={{ backgroundColor: previewBotBubbleBg, color: previewBotBubbleText }}
                  >
                    Azaroth Enterprise Commerce supports sub-second edge responses and multi-warehouse sync.
                  </div>
                </div>
              </div>

              {/* Mock Input Footer */}
              <div className="p-2.5 border-t border-slate-200 bg-white/70 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="Ask a technical or platform question..."
                  className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-500"
                />
                <button
                  type="button"
                  style={{ backgroundColor: previewSendBg, color: previewSendText }}
                  className="p-2 rounded-lg cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Launcher button indicator */}
            <div className="cms-public-preview flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Launcher Appearance:</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow"
                style={{ background: previewLauncherBg }}
              >
                <Bot className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONA & PRESENTATION */}
      {activeTab === 'persona' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bot className="w-4 h-4 text-[#35123F]" />
            <h3 className="text-sm font-bold text-slate-800">Chatbot Persona & Presentation Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Assistant Name
              </label>
              <input
                type="text"
                value={botCfg.botName || ''}
                onChange={(e) => handleUpdateBotCfg('botName', e.target.value)}
                placeholder="Solutions Advisor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subtitle / Status Line
              </label>
              <input
                type="text"
                value={botCfg.statusText || ''}
                onChange={(e) => handleUpdateBotCfg('statusText', e.target.value)}
                placeholder="Rule-based Enterprise Assistant"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Launcher Trigger Label
              </label>
              <input
                type="text"
                value={botCfg.triggerLabel || ''}
                onChange={(e) => handleUpdateBotCfg('triggerLabel', e.target.value)}
                placeholder="Solutions Advisor"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Input Box Placeholder
              </label>
              <input
                type="text"
                value={botCfg.placeholderText || ''}
                onChange={(e) => handleUpdateBotCfg('placeholderText', e.target.value)}
                placeholder="Ask a technical or platform question..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Welcome Opening Message
              </label>
              <textarea
                rows={2}
                value={botCfg.welcomeMessage || ''}
                onChange={(e) => handleUpdateBotCfg('welcomeMessage', e.target.value)}
                placeholder="Welcome greeting shown when the conversation opens..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F] resize-none"
              />
            </div>

            {/* Avatar URL & Upload PNG */}
            <div className="md:col-span-2 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block font-semibold text-slate-700">
                Bot Avatar Image (Image URL or Upload PNG)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={botCfg.avatarUrl || ''}
                  onChange={(e) => handleUpdateBotCfg('avatarUrl', e.target.value)}
                  placeholder="Enter image URL or select from Media Library"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:border-[#35123F]"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#35123F]" />
                    <span>Media Library</span>
                  </button>
                  <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-[#D5A13C]" />
                    <span>{uploadingAvatar ? 'Uploading...' : 'Upload PNG'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleUploadAvatar}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {botCfg.avatarUrl && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={botCfg.avatarUrl}
                      alt="Bot avatar preview"
                      className="w-10 h-10 object-cover rounded-full border border-slate-200 shrink-0"
                    />
                    <span className="text-[11px] text-slate-600 truncate font-mono">
                      {botCfg.avatarUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdateBotCfg('avatarUrl', '')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium shrink-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TECHNICAL FAQS */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#35123F]" />
              <h3 className="text-sm font-bold text-slate-800">
                Configured Knowledge Base FAQs ({faqs.length})
              </h3>
            </div>
            <button
              onClick={() =>
                setEditingFaq({
                  question: '',
                  answer: '',
                  category: 'General',
                  keywords: [],
                })
              }
              className="px-3.5 py-2 bg-[#171B2C] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Technical FAQ</span>
            </button>
          </div>

          {faqs.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No FAQ entries added yet. Click &ldquo;Add Technical FAQ&rdquo; above to create one.
            </div>
          ) : (
            faqs.map((faq) => (
              <div
                key={faq.id}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#35123F] bg-[#35123F]/5 px-2 py-0.5 rounded">
                      {faq.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{faq.question}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingFaq(faq)}
                      className="px-2.5 py-1 text-xs border border-slate-300 hover:bg-slate-50 rounded text-slate-700 cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1 text-rose-600 hover:text-rose-800 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                {faq.keywords && faq.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {faq.keywords.map((kw, i) => (
                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              {editingFaq.id ? 'Edit FAQ Entry' : 'New Technical FAQ'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={editingFaq.category || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  placeholder="e.g. Architecture, Compliance, Integration"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">User Question</label>
                <input
                  type="text"
                  value={editingFaq.question || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. How does platform integration work?"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Answer</label>
                <textarea
                  rows={4}
                  value={editingFaq.answer || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Detailed architectural answer..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F] resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trigger Keywords (comma separated)
                </label>
                <input
                  type="text"
                  value={editingFaq.keywords?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingFaq({
                      ...editingFaq,
                      keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                    })
                  }
                  placeholder="e.g. ehr, hipaa, clinic, integration"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingFaq(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveFaq(editingFaq)}
                className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(item) => {
          handleUpdateBotCfg('avatarUrl', item.url);
          setShowMediaPicker(false);
        }}
      />
    </div>
  );
};
