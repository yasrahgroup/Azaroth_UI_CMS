import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Image as ImageIcon,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Save,
  Check,
  AlertCircle,
  Move,
  Settings2,
  Eye,
  RotateCcw,
  Palette,
  Share2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  FooterColumn,
  FooterConfig,
  FooterElementConfig,
  FooterElementType,
  FooterLayoutColumn,
  FooterLayoutSection,
  FooterSocialItem,
} from '../../types';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { DEFAULT_SETTINGS } from '../../constants/defaultSettings';
import {
  AVAILABLE_FOOTER_ELEMENTS,
  SUPPORTED_SOCIAL_PLATFORMS,
  getEffectiveFooterSections,
  getEffectiveSocialItems,
  normalizeFooterConfig,
} from '../../utils/footerLayout';
import { Footer } from '../../components/public/Footer';
import { uploadAdminMedia } from '../../utils/mediaUpload';

export const FooterManager: React.FC = () => {
  const { editorSettings, updateDraftSettings, publishSettings, isSaving } = useTheme();
  const [activeTab, setActiveTab] = useState<'layout' | 'elements' | 'social' | 'styles'>('layout');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Selected element for editing in sidebar/drawer
  const [editingElementTarget, setEditingElementTarget] = useState<{
    sectionId: string;
    columnId: string;
    elementId: string;
  } | null>(null);

  // Modal for adding a new element to a specific column
  const [addElementTarget, setAddElementTarget] = useState<{
    sectionId: string;
    columnId: string;
  } | null>(null);

  const cfg: FooterConfig = editorSettings?.footer || DEFAULT_SETTINGS.footer;
  const sections = getEffectiveFooterSections(cfg);
  const socialItems = getEffectiveSocialItems(cfg);

  const handleUpdateFooter = async (updates: Partial<FooterConfig>): Promise<boolean> => {
    const updated: FooterConfig = normalizeFooterConfig({
      ...cfg,
      ...updates,
    }).config;
    const ok = await updateDraftSettings({ footer: updated });
    if (!ok) {
      setFeedbackIsError(true);
      setFeedback('Footer update could not be saved');
      setTimeout(() => setFeedback(null), 3000);
      return false;
    }
    setFeedbackIsError(false);
    setFeedback('Footer draft updated');
    setTimeout(() => setFeedback(null), 2000);
    return true;
  };

  const handlePublish = async () => {
    const ok = await publishSettings();
    if (ok) {
      setFeedbackIsError(false);
      setFeedback('Footer successfully published to live website!');
      setTimeout(() => setFeedback(null), 3500);
    } else {
      setFeedbackIsError(true);
      setFeedback('Failed to publish footer');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // ----------------------------------------------------
  // SECTION & COLUMN MANAGEMENT
  // ----------------------------------------------------
  const handleAddSection = (type: 'main' | 'top_bar' | 'bottom_bar') => {
    const newSection: FooterLayoutSection = {
      id: `sec-${Date.now()}`,
      title: type === 'top_bar' ? 'Top Utility Bar' : type === 'bottom_bar' ? 'Bottom Bar' : 'Content Section',
      type,
      paddingY: type === 'bottom_bar' ? 'compact' : 'normal',
      borderTop: type === 'bottom_bar',
      borderBottom: type === 'top_bar',
      columns: [
        {
          id: `col-${Date.now()}-1`,
          width: 'auto',
          alignment: 'left',
          elements: [
            {
              id: `el-${Date.now()}-1`,
              type: type === 'bottom_bar' ? 'copyright' : 'brand_text',
            },
          ],
        },
      ],
    };
    handleUpdateFooter({ sections: [...sections, newSection] });
  };

  const handleDeleteSection = (sectionId: string) => {
    if (sections.length <= 1) {
      alert('You must have at least one footer section.');
      return;
    }
    if (!confirm('Are you sure you want to delete this footer section?')) return;
    const filtered = sections.filter((s) => s.id !== sectionId);
    handleUpdateFooter({ sections: filtered });
  };

  const handleMoveSection = (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;
    const cloned = [...sections];
    const temp = cloned[idx];
    cloned[idx] = cloned[targetIdx];
    cloned[targetIdx] = temp;
    handleUpdateFooter({ sections: cloned });
  };

  const handleUpdateSectionProps = (sectionId: string, updates: Partial<FooterLayoutSection>) => {
    const updatedSections = sections.map((sec) =>
      sec.id === sectionId ? { ...sec, ...updates } : sec
    );
    handleUpdateFooter({ sections: updatedSections });
  };

  const handleAddColumnToSection = (sectionId: string) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        const newCol: FooterLayoutColumn = {
          id: `col-${Date.now()}`,
          width: 'auto',
          alignment: 'left',
          elements: [
            {
              id: `el-${Date.now()}`,
              type: 'custom_text',
              title: 'New Column Block',
              content: 'Custom footer details or links.',
            },
          ],
        };
        return {
          ...sec,
          columns: [...sec.columns, newCol],
        };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
  };

  const handleDeleteColumn = (sectionId: string, columnId: string) => {
    const targetSection = sections.find((s) => s.id === sectionId);
    if (!targetSection) return;
    if (targetSection.columns.length <= 1) {
      alert('A section must have at least one column. You can delete the section instead.');
      return;
    }
    if (!confirm('Delete this column and all its elements?')) return;

    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          columns: sec.columns.filter((c) => c.id !== columnId),
        };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
  };

  const handleMoveColumn = (sectionId: string, colIdx: number, dir: 'left' | 'right') => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        const targetIdx = dir === 'left' ? colIdx - 1 : colIdx + 1;
        if (targetIdx < 0 || targetIdx >= sec.columns.length) return sec;
        const cols = [...sec.columns];
        const temp = cols[colIdx];
        cols[colIdx] = cols[targetIdx];
        cols[targetIdx] = temp;
        return { ...sec, columns: cols };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
  };

  const handleUpdateColumnProps = (
    sectionId: string,
    columnId: string,
    updates: Partial<FooterLayoutColumn>
  ) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          columns: sec.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
        };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
  };

  // ----------------------------------------------------
  // ELEMENT MANAGEMENT & DRAG AND DROP
  // ----------------------------------------------------
  const handleAddElementToColumn = (
    sectionId: string,
    columnId: string,
    type: FooterElementType
  ) => {
    const meta = AVAILABLE_FOOTER_ELEMENTS.find((e) => e.type === type);
    const newEl: FooterElementConfig = {
      id: `el-${type}-${Date.now()}`,
      type,
      title: meta?.defaultTitle || undefined,
      alignment: 'left',
    };

    // If it's a nav_column, connect to first available column or create one
    if (type === 'nav_column') {
      const existingCol = (cfg.columns || [])[0];
      if (existingCol) {
        newEl.columnId = existingCol.id;
        newEl.title = existingCol.title;
      }
    }

    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === columnId) {
              return { ...col, elements: [...col.elements, newEl] };
            }
            return col;
          }),
        };
      }
      return sec;
    });

    handleUpdateFooter({ sections: updatedSections });
    setAddElementTarget(null);
  };

  const handleDeleteElement = (sectionId: string, columnId: string, elementId: string) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                elements: col.elements.filter((el) => el.id !== elementId),
              };
            }
            return col;
          }),
        };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
    if (editingElementTarget?.elementId === elementId) {
      setEditingElementTarget(null);
    }
  };

  const handleMoveElementWithinColumn = (
    sectionId: string,
    columnId: string,
    elemIdx: number,
    dir: 'up' | 'down'
  ) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === columnId) {
              const targetIdx = dir === 'up' ? elemIdx - 1 : elemIdx + 1;
              if (targetIdx < 0 || targetIdx >= col.elements.length) return col;
              const cloned = [...col.elements];
              const temp = cloned[elemIdx];
              cloned[elemIdx] = cloned[targetIdx];
              cloned[targetIdx] = temp;
              return { ...col, elements: cloned };
            }
            return col;
          }),
        };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
  };

  const handleMoveElementToColumn = (
    srcSectionId: string,
    srcColumnId: string,
    elemId: string,
    destSectionId: string,
    destColumnId: string
  ) => {
    let movingElement: FooterElementConfig | null = null;

    // Remove from source
    const withoutMoved = sections.map((sec) => {
      if (sec.id === srcSectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === srcColumnId) {
              const target = col.elements.find((e) => e.id === elemId);
              if (target) movingElement = target;
              return { ...col, elements: col.elements.filter((e) => e.id !== elemId) };
            }
            return col;
          }),
        };
      }
      return sec;
    });

    if (!movingElement) return;

    // Add to destination
    const finalSections = withoutMoved.map((sec) => {
      if (sec.id === destSectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === destColumnId) {
              return { ...col, elements: [...col.elements, movingElement!] };
            }
            return col;
          }),
        };
      }
      return sec;
    });

    handleUpdateFooter({ sections: finalSections });
  };

  const handleBringFollowUsToSection1 = () => {
    let socialEl: FooterElementConfig | null = null;

    // Find and remove social_links from all sections
    const cleaned = sections.map((sec) => ({
      ...sec,
      columns: sec.columns.map((col) => ({
        ...col,
        elements: col.elements.filter((el) => {
          if (el.type === 'social_links') {
            socialEl = el;
            return false;
          }
          return true;
        }),
      })),
    }));

    if (!socialEl) {
      socialEl = {
        id: `el-social-${Date.now()}`,
        type: 'social_links',
        title: cfg.socialHeading || 'Follow Us',
      };
    }

    // Add to Section 1, Column 1 (or 1st column)
    const updated = cleaned.map((sec, idx) => {
      if (idx === 0) {
        const cols = [...sec.columns];
        if (cols.length > 0) {
          cols[0] = {
            ...cols[0],
            elements: [...cols[0].elements, socialEl!],
          };
        }
        return { ...sec, columns: cols };
      }
      return sec;
    });

    handleUpdateFooter({ sections: updated });
    setFeedbackIsError(false);
    setFeedback('Follow Us brought to Section 1');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleQuickMoveToSection = (
    srcSectionId: string,
    srcColId: string,
    elemId: string,
    targetSectionIndex: number
  ) => {
    let movingEl: FooterElementConfig | null = null;
    const withoutMoved = sections.map((sec) => {
      if (sec.id === srcSectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === srcColId) {
              const target = col.elements.find((e) => e.id === elemId);
              if (target) movingEl = target;
              return { ...col, elements: col.elements.filter((e) => e.id !== elemId) };
            }
            return col;
          }),
        };
      }
      return sec;
    });

    if (!movingEl) return;

    const targetSec = withoutMoved[targetSectionIndex];
    if (!targetSec || targetSec.columns.length === 0) return;

    const final = withoutMoved.map((sec, sIdx) => {
      if (sIdx === targetSectionIndex) {
        const cols = [...sec.columns];
        cols[0] = { ...cols[0], elements: [...cols[0].elements, movingEl!] };
        return { ...sec, columns: cols };
      }
      return sec;
    });

    handleUpdateFooter({ sections: final });
    setFeedbackIsError(false);
    setFeedback(`Element moved to Section ${targetSectionIndex + 1}`);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleUpdateElementConfig = (
    sectionId: string,
    columnId: string,
    elementId: string,
    updates: Partial<FooterElementConfig>
  ) => {
    const updatedSections = sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => {
            if (col.id === columnId) {
              return {
                ...col,
                elements: col.elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
              };
            }
            return col;
          }),
        };
      }
      return sec;
    });
    handleUpdateFooter({ sections: updatedSections });
  };

  // Find currently selected element for editing
  const editingElement = (() => {
    if (!editingElementTarget) return null;
    const sec = sections.find((s) => s.id === editingElementTarget.sectionId);
    const col = sec?.columns.find((c) => c.id === editingElementTarget.columnId);
    return col?.elements.find((e) => e.id === editingElementTarget.elementId) || null;
  })();

  // ----------------------------------------------------
  // SOCIAL MEDIA TAB CONTROLS
  // ----------------------------------------------------
  const handleUpdateSocialItem = (id: string, updates: Partial<FooterSocialItem>) => {
    const updated = socialItems.map((s) => (s.id === id ? { ...s, ...updates } : s));
    handleUpdateFooter({ socialItems: updated });
  };

  // ----------------------------------------------------
  // NAVIGATION COLUMNS MANAGEMENT
  // ----------------------------------------------------
  const handleAddNavColumn = () => {
    const timestamp = Date.now();
    const newCol: FooterColumn = {
      id: 'col-' + timestamp,
      title: 'New Navigation',
      links: [{ id: 'l-' + timestamp, label: 'Home', url: '/' }],
    };

    // Unbound nav_column elements automatically display every link list.
    // When all existing elements are bound to a specific list, add a new
    // layout column so the newly created list is visible immediately.
    const navElements = sections.flatMap((section) =>
      section.columns.flatMap((column) => column.elements.filter((el) => el.type === 'nav_column'))
    );
    const hasUnboundNav = navElements.some((el) => !el.columnId);
    let updatedSections = sections;

    if (!hasUnboundNav) {
      const mainSectionIndex = sections.findIndex((section) => section.type === 'main');
      const targetIndex = mainSectionIndex >= 0 ? mainSectionIndex : 0;
      updatedSections = sections.map((section, index) => {
        if (index !== targetIndex) return section;
        return {
          ...section,
          columns: [
            ...section.columns,
            {
              id: `col-nav-${timestamp}`,
              width: 'auto',
              alignment: 'left',
              elements: [
                {
                  id: `el-nav-${timestamp}`,
                  type: 'nav_column',
                  title: newCol.title,
                  columnId: newCol.id,
                },
              ],
            },
          ],
        };
      });
    }

    handleUpdateFooter({
      columns: [...(cfg.columns || []), newCol],
      sections: updatedSections,
    });
  };

  const handleDeleteNavColumn = (colId: string) => {
    const cols = (cfg.columns || []).filter((c) => c.id !== colId);
    const updatedSections = sections.map((section) => ({
      ...section,
      columns: section.columns.map((column) => ({
        ...column,
        elements: column.elements.filter(
          (el) => !(el.type === 'nav_column' && el.columnId === colId)
        ),
      })),
    }));
    handleUpdateFooter({ columns: cols, sections: updatedSections });
  };

  const handleAddLinkToNavColumn = (colId: string) => {
    const cols = (cfg.columns || []).map((c) => {
      if (c.id === colId) {
        return {
          ...c,
          links: [...c.links, { id: 'l-' + Date.now(), label: 'New Link', url: '/#' }],
        };
      }
      return c;
    });
    handleUpdateFooter({ columns: cols });
  };

  const handleUpdateNavLink = (colId: string, linkId: string, updates: any) => {
    const cols = (cfg.columns || []).map((c) => {
      if (c.id === colId) {
        return {
          ...c,
          links: c.links.map((l) => (l.id === linkId ? { ...l, ...updates } : l)),
        };
      }
      return c;
    });
    handleUpdateFooter({ columns: cols });
  };

  const handleDeleteNavLink = (colId: string, linkId: string) => {
    const cols = (cfg.columns || []).map((c) => {
      if (c.id === colId) {
        return { ...c, links: c.links.filter((l) => l.id !== linkId) };
      }
      return c;
    });
    handleUpdateFooter({ columns: cols });
  };

  // Logo upload handler
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const result = await uploadAdminMedia(file);
      if (result.ok) {
        await handleUpdateFooter({ logoUrl: result.media.url });
        setFeedbackIsError(false);
        setFeedback('Footer logo uploaded successfully');
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
      }
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner: Status, Save & Publish */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-[#171B2C]">
              Flexible Footer Layout Builder
            </h2>
            <span className="bg-[#35123F]/10 text-[#35123F] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Visual CMS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Design and arrange custom footer sections, columns, logo, social links, and navigation
            without layout restrictions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {feedback && (
            <div
              data-testid="footer-feedback"
              role="status"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-in fade-in duration-200 ${
                feedbackIsError
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {feedbackIsError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{feedback}</span>
            </div>
          )}

          <button
            type="button"
            data-testid="footer-publish"
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#D5A13C]" />
            <span>Publish to Live</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2">
        {[
          { id: 'layout', label: '1. Layout & Column Builder', icon: Layers },
          { id: 'elements', label: '2. Elements & Content', icon: Settings2 },
          { id: 'social', label: '3. Social Media & Links', icon: Share2 },
          { id: 'styles', label: '4. Colors & Appearance', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`footer-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#35123F] text-[#35123F]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISUAL LAYOUT & COLUMN BUILDER */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Footer Section Architecture</h3>
                <p className="text-xs text-slate-500">
                  Organize your footer into horizontal sections. Each section contains flexible
                  columns with independently movable elements.
                </p>
              </div>

              {/* Add Section Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleBringFollowUsToSection1}
                  className="px-3 py-1.5 bg-[#D5A13C]/20 hover:bg-[#D5A13C]/30 text-slate-900 border border-[#D5A13C] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Move Follow Us / Social Links into Section 1"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#35123F]" />
                  <span>Bring Follow Us to Section 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('main')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-[#35123F] text-[#35123F] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSection('bottom_bar')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D5A13C]" />
                  <span>+ Bottom Bar</span>
                </button>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-6">
              {sections.map((section, sIdx) => (
                <div
                  key={section.id}
                  className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all hover:border-slate-300"
                >
                  {/* Section Top Header */}
                  <div className="px-4 py-3 bg-[#171B2C] text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-[#D5A13C] uppercase tracking-wider">
                        Section #{sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => handleUpdateSectionProps(section.id, { title: e.target.value })}
                        placeholder="Section Title"
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#D5A13C]"
                      />
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/15 text-slate-200">
                        {section.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Section Padding Selector */}
                      <select
                        value={section.paddingY || 'normal'}
                        onChange={(e) =>
                          handleUpdateSectionProps(section.id, { paddingY: e.target.value as any })
                        }
                        className="px-2 py-1 bg-white/10 text-white border border-white/20 rounded text-[11px] focus:outline-none"
                      >
                        <option value="none" className="text-slate-900">Padding: None</option>
                        <option value="compact" className="text-slate-900">Padding: Compact</option>
                        <option value="normal" className="text-slate-900">Padding: Standard</option>
                        <option value="relaxed" className="text-slate-900">Padding: Spacious</option>
                      </select>

                      {/* Section Border Toggles */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSectionProps(section.id, { borderTop: !section.borderTop })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                          section.borderTop
                            ? 'bg-[#D5A13C] text-slate-900 border-[#D5A13C]'
                            : 'border-white/20 text-white/70 hover:text-white'
                        }`}
                        title="Toggle Top Border Divider"
                      >
                        Border Top
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateSectionProps(section.id, { borderBottom: !section.borderBottom })
                        }
                        className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                          section.borderBottom
                            ? 'bg-[#D5A13C] text-slate-900 border-[#D5A13C]'
                            : 'border-white/20 text-white/70 hover:text-white'
                        }`}
                        title="Toggle Bottom Border Divider"
                      >
                        Border Bottom
                      </button>

                      {/* Reorder Section Up/Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveSection(sIdx, 'up')}
                        disabled={sIdx === 0}
                        className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Section Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection(sIdx, 'down')}
                        disabled={sIdx === sections.length - 1}
                        className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Move Section Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Column button */}
                      <button
                        type="button"
                        onClick={() => handleAddColumnToSection(section.id)}
                        className="ml-2 px-2.5 py-1 bg-white text-[#171B2C] hover:bg-slate-100 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-[#35123F]" />
                        <span>Add Column</span>
                      </button>

                      {/* Delete Section */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1 text-rose-300 hover:text-rose-100 cursor-pointer ml-1"
                        title="Delete Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Section Columns Canvas */}
                  <div className="p-4 bg-slate-50/70 overflow-x-auto">
                    <div className="flex flex-col md:flex-row gap-4 items-stretch min-w-full">
                      {section.columns.map((col, cIdx) => (
                        <div
                          key={col.id}
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between space-y-3 min-w-[220px]"
                        >
                          {/* Column Header Controls */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-700">
                                Col #{cIdx + 1}
                              </span>
                              {/* Alignment Selector */}
                              <div className="flex items-center border border-slate-200 rounded p-0.5 bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateColumnProps(section.id, col.id, { alignment: 'left' })}
                                  className={`p-1 rounded ${col.alignment === 'left' || !col.alignment ? 'bg-white shadow-xs text-[#35123F]' : 'text-slate-400'}`}
                                  title="Align Left"
                                >
                                  <AlignLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateColumnProps(section.id, col.id, { alignment: 'center' })}
                                  className={`p-1 rounded ${col.alignment === 'center' ? 'bg-white shadow-xs text-[#35123F]' : 'text-slate-400'}`}
                                  title="Align Center"
                                >
                                  <AlignCenter className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateColumnProps(section.id, col.id, { alignment: 'right' })}
                                  className={`p-1 rounded ${col.alignment === 'right' ? 'bg-white shadow-xs text-[#35123F]' : 'text-slate-400'}`}
                                  title="Align Right"
                                >
                                  <AlignRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Reorder Column Left/Right */}
                              <button
                                type="button"
                                onClick={() => handleMoveColumn(section.id, cIdx, 'left')}
                                disabled={cIdx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                title="Move Column Left"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveColumn(section.id, cIdx, 'right')}
                                disabled={cIdx === section.columns.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                title="Move Column Right"
                              >
                                →
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteColumn(section.id, col.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Delete Column"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Movable Elements inside Column */}
                          <div className="space-y-2 flex-1">
                            {col.elements.length === 0 ? (
                              <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-[11px] text-slate-400">
                                Column is empty. Click + Element to add.
                              </div>
                            ) : (
                              col.elements.map((el, elIdx) => {
                                const meta = AVAILABLE_FOOTER_ELEMENTS.find((m) => m.type === el.type);
                                const isSelected = editingElementTarget?.elementId === el.id;

                                return (
                                  <div
                                    key={el.id}
                                    className={`p-2.5 rounded-lg border transition-all text-xs flex items-center justify-between gap-2 ${
                                      isSelected
                                        ? 'bg-[#35123F]/5 border-[#35123F] ring-1 ring-[#35123F]'
                                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Move className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-grab" />
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-800 truncate">
                                          {el.title || meta?.label || el.type}
                                        </div>
                                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                                          {meta?.label || el.type}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {/* Quick move across sections */}
                                      {sIdx !== 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickMoveToSection(section.id, col.id, el.id, 0)}
                                          className="text-[10px] bg-amber-50 hover:bg-[#35123F] hover:text-white border border-amber-200 px-1.5 py-0.5 rounded font-bold text-amber-800 transition-colors cursor-pointer"
                                          title="Move this element to Section 1"
                                        >
                                          ↑ Sec 1
                                        </button>
                                      )}
                                      {sIdx === 0 && sections.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleQuickMoveToSection(section.id, col.id, el.id, 1)}
                                          className="text-[10px] bg-slate-100 hover:bg-[#35123F] hover:text-white border border-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-600 transition-colors cursor-pointer"
                                          title="Move this element to Section 2"
                                        >
                                          ↓ Sec 2
                                        </button>
                                      )}

                                      {/* Up/Down within column */}
                                      <button
                                        type="button"
                                        onClick={() => handleMoveElementWithinColumn(section.id, col.id, elIdx, 'up')}
                                        disabled={elIdx === 0}
                                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                        title="Move Element Up"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveElementWithinColumn(section.id, col.id, elIdx, 'down')}
                                        disabled={elIdx === col.elements.length - 1}
                                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                                        title="Move Element Down"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Configure Element */}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingElementTarget({
                                            sectionId: section.id,
                                            columnId: col.id,
                                            elementId: el.id,
                                          })
                                        }
                                        className={`p-1 rounded cursor-pointer ${
                                          isSelected ? 'text-[#35123F]' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                        title="Configure Element"
                                      >
                                        <Settings2 className="w-3.5 h-3.5" />
                                      </button>

                                      {/* Delete Element */}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteElement(section.id, col.id, el.id)}
                                        className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                        title="Remove Element"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Add Element Button to this Column */}
                          <button
                            type="button"
                            onClick={() => setAddElementTarget({ sectionId: section.id, columnId: col.id })}
                            className="w-full py-1.5 border border-dashed border-slate-300 hover:border-[#35123F] hover:bg-[#35123F]/5 text-slate-600 hover:text-[#35123F] rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Element</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ELEMENTS & CONTENT CONFIGURATION */}
      {activeTab === 'elements' && (
        <div className="space-y-6">
          {/* Logo & Brand Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#35123F]" />
              Company Logo & Branding
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Footer Logo URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cfg.logoUrl || ''}
                      onChange={(e) => handleUpdateFooter({ logoUrl: e.target.value })}
                      placeholder="e.g. /uploads/logo.png"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Media</span>
                    </button>
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-[#D5A13C]" />
                      <span>{uploadingLogo ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Max Width (px)
                    </label>
                    <input
                      type="number"
                      value={cfg.logoWidth || 140}
                      onChange={(e) => handleUpdateFooter({ logoWidth: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Max Height (px)
                    </label>
                    <input
                      type="number"
                      value={cfg.logoHeight || 44}
                      onChange={(e) => handleUpdateFooter({ logoHeight: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Spacing Gap (px)
                    </label>
                    <input
                      type="number"
                      value={cfg.logoSpacing || 10}
                      onChange={(e) => handleUpdateFooter({ logoSpacing: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={cfg.brandName || ''}
                      onChange={(e) => handleUpdateFooter({ brandName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sub Name / Suffix
                    </label>
                    <input
                      type="text"
                      value={cfg.brandSubName || ''}
                      onChange={(e) => handleUpdateFooter({ brandSubName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-bold text-[#35123F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Bio / Description
                  </label>
                  <textarea
                    rows={2}
                    value={cfg.companyDescription || ''}
                    onChange={(e) => handleUpdateFooter({ companyDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#35123F]" />
              Direct Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={cfg.contactEmail || ''}
                  onChange={(e) => handleUpdateFooter({ contactEmail: e.target.value })}
                  placeholder="contact@company.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={cfg.contactPhone || ''}
                  onChange={(e) => handleUpdateFooter({ contactPhone: e.target.value })}
                  placeholder="+1 (800) 555-0199"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Address
                </label>
                <input
                  type="text"
                  value={cfg.address || ''}
                  onChange={(e) => handleUpdateFooter({ address: e.target.value })}
                  placeholder="One Corporate Plaza, Suite 400"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Newsletter & Legal */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#35123F]" />
              Newsletter &amp; Legal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Newsletter Title
                </label>
                <input
                  type="text"
                  data-testid="footer-newsletter-title-input"
                  value={cfg.newsletterTitle || ''}
                  onChange={(e) => handleUpdateFooter({ newsletterTitle: e.target.value })}
                  placeholder="Stay Connected"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Newsletter Button Text
                </label>
                <input
                  type="text"
                  value={cfg.newsletterButtonText || ''}
                  onChange={(e) => handleUpdateFooter({ newsletterButtonText: e.target.value })}
                  placeholder="Subscribe"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Newsletter Subtitle
                </label>
                <input
                  type="text"
                  value={cfg.newsletterSubtitle || ''}
                  onChange={(e) => handleUpdateFooter({ newsletterSubtitle: e.target.value })}
                  placeholder="Latest enterprise updates and telemetry digests."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Placeholder
                </label>
                <input
                  type="text"
                  value={cfg.newsletterPlaceholder || ''}
                  onChange={(e) => handleUpdateFooter({ newsletterPlaceholder: e.target.value })}
                  placeholder="Enter your email..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Copyright Text
                </label>
                <input
                  type="text"
                  data-testid="footer-copyright-input"
                  value={cfg.copyrightText || ''}
                  onChange={(e) => handleUpdateFooter({ copyrightText: e.target.value })}
                  placeholder="© {year} Company Name. All rights reserved."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Use <code>{'{year}'}</code> to insert the current year automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links Columns Management */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Navigation Columns & Links
                </h3>
                <p className="text-xs text-slate-500">
                  Manage reusable link lists that can be placed in any column via the “Navigation Column” element.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddNavColumn}
                className="px-3 py-1.5 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Link List</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(cfg.columns || []).map((col) => (
                <div
                  key={col.id}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <input
                      type="text"
                      value={col.title}
                      onChange={(e) => {
                        const nextTitle = e.target.value;
                        const cols = (cfg.columns || []).map((c) =>
                          c.id === col.id ? { ...c, title: nextTitle } : c
                        );
                        const updatedSections = sections.map((section) => ({
                          ...section,
                          columns: section.columns.map((column) => ({
                            ...column,
                            elements: column.elements.map((el) =>
                              el.type === 'nav_column' && el.columnId === col.id
                                ? { ...el, title: nextTitle }
                                : el
                            ),
                          })),
                        }));
                        handleUpdateFooter({ columns: cols, sections: updatedSections });
                      }}
                      className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-[#35123F] text-xs py-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteNavColumn(col.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      title="Delete Column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {col.links.map((link) => (
                      <div
                        key={link.id}
                        className="p-2 bg-white border border-slate-200 rounded flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) =>
                              handleUpdateNavLink(col.id, link.id, { label: e.target.value })
                            }
                            placeholder="Link Label"
                            className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[11px]"
                          />
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) =>
                              handleUpdateNavLink(col.id, link.id, { url: e.target.value })
                            }
                            placeholder="URL / Path"
                            className="w-full px-1.5 py-0.5 border border-slate-200 rounded text-[10px] font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteNavLink(col.id, link.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddLinkToNavColumn(col.id)}
                    className="w-full py-1 text-center text-xs font-semibold text-[#35123F] hover:underline cursor-pointer border border-dashed border-slate-300 rounded bg-white"
                  >
                    + Add Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL MEDIA CONFIGURATION */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#35123F]" />
                Social Media Platforms & “Follow Us” Styling
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure supported social networks, brand URLs, colors, and presentation styles.
                Social icons can be placed anywhere in the layout builder via the “Social Media Icons” element.
              </p>
            </div>

            {/* Global Social Heading & Style Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  “Follow Us” Heading Text
                </label>
                <input
                  type="text"
                  value={cfg.socialHeading ?? 'Follow Us'}
                  onChange={(e) => handleUpdateFooter({ socialHeading: e.target.value })}
                  placeholder="e.g. Follow Us / Connect Online"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Icon Display Style
                </label>
                <select
                  value={cfg.socialStyle || 'plain'}
                  onChange={(e) => handleUpdateFooter({ socialStyle: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="plain">Minimal Plain Icons</option>
                  <option value="circle">Circular Background Badges</option>
                  <option value="square">Rounded Square Tiles</option>
                  <option value="outline">Outlined Border Boxes</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Icon Size
                </label>
                <select
                  value={cfg.socialSize || 'md'}
                  onChange={(e) => handleUpdateFooter({ socialSize: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs"
                >
                  <option value="sm">Compact (Small)</option>
                  <option value="md">Standard (Medium)</option>
                  <option value="lg">Prominent (Large)</option>
                </select>
              </div>
            </div>

            {/* Social Platforms List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {socialItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.enabled
                      ? 'bg-white border-slate-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.enabled !== false}
                        onChange={(e) =>
                          handleUpdateSocialItem(item.id, { enabled: e.target.checked })
                        }
                        id={`check-${item.id}`}
                        data-testid={`footer-social-enabled-${item.platform}`}
                        className="rounded text-[#35123F] focus:ring-[#35123F] cursor-pointer"
                      />
                      <label
                        htmlFor={`check-${item.id}`}
                        className="font-bold text-xs text-slate-900 capitalize cursor-pointer"
                      >
                        {item.label || item.platform}
                      </label>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Color:</span>
                      <input
                        type="color"
                        value={item.iconColor || '#D5A13C'}
                        onChange={(e) =>
                          handleUpdateSocialItem(item.id, { iconColor: e.target.value })
                        }
                        className="w-5 h-5 rounded border border-slate-200 cursor-pointer p-0"
                        title="Custom Icon Color"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => handleUpdateSocialItem(item.id, { url: e.target.value })}
                      placeholder={`https://${item.platform}.com/...`}
                      data-testid={`footer-social-url-${item.platform}`}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STYLES & APPEARANCE */}
      {activeTab === 'styles' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#35123F]" />
                Colors, Typography & Global Direction
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Customize background tints, typography inks, and reading direction.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Footer Background
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cfg.backgroundColor || '#171B2C'}
                    onChange={(e) => handleUpdateFooter({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={cfg.backgroundColor || '#171B2C'}
                    onChange={(e) => handleUpdateFooter({ backgroundColor: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Text & Body Ink
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cfg.textColor || '#FAF7F2'}
                    onChange={(e) => handleUpdateFooter({ textColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={cfg.textColor || '#FAF7F2'}
                    onChange={(e) => handleUpdateFooter({ textColor: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accent & Heading Ink
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cfg.accentColor || '#D5A13C'}
                    onChange={(e) => handleUpdateFooter({ accentColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={cfg.accentColor || '#D5A13C'}
                    onChange={(e) => handleUpdateFooter({ accentColor: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reading Direction
                </label>
                <select
                  value={cfg.direction || 'ltr'}
                  onChange={(e) => handleUpdateFooter({ direction: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="ltr">LTR (Left to Right — Standard)</option>
                  <option value="rtl">RTL (Right to Left — Arabic / Hebrew)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name & Subname Layout
                </label>
                <select
                  value={cfg.brandLayout || 'inline'}
                  onChange={(e) => handleUpdateFooter({ brandLayout: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="inline">Inline (Side by side)</option>
                  <option value="stacked">Stacked (Subname underneath)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE FOOTER PREVIEW DRAWER */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#D5A13C]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Interactive Footer Live Preview
            </span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
              Draft Sync
            </span>
          </div>

          {/* Responsive Device Switcher */}
          <div className="flex items-center border border-white/20 rounded-lg p-0.5 bg-white/5">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs cursor-pointer ${
                previewDevice === 'desktop'
                  ? 'bg-[#35123F] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('tablet')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs cursor-pointer ${
                previewDevice === 'tablet'
                  ? 'bg-[#35123F] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded flex items-center gap-1 text-xs cursor-pointer ${
                previewDevice === 'mobile'
                  ? 'bg-[#35123F] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Device Simulation Container */}
        <div className="bg-slate-100 p-4 sm:p-8 flex justify-center overflow-x-auto min-h-[300px]">
          <div
            className={`cms-public-preview transition-all duration-300 bg-[#171B2C] shadow-2xl overflow-hidden rounded-xl ${
              previewDevice === 'desktop'
                ? 'w-full'
                : previewDevice === 'tablet'
                ? 'w-[768px]'
                : 'w-[375px]'
            }`}
          >
                <Footer config={cfg} />
          </div>
        </div>
      </div>

      {/* MODAL: ADD ELEMENT TO COLUMN */}
      {addElementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Select Footer Element to Add
              </h3>
              <button
                type="button"
                onClick={() => setAddElementTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {AVAILABLE_FOOTER_ELEMENTS.map((el) => (
                <button
                  key={el.type}
                  type="button"
                  onClick={() =>
                    handleAddElementToColumn(
                      addElementTarget.sectionId,
                      addElementTarget.columnId,
                      el.type
                    )
                  }
                  className="p-3 text-left border border-slate-200 hover:border-[#35123F] hover:bg-[#35123F]/5 rounded-xl transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#35123F] block">
                      {el.label}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {el.description}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#35123F] font-semibold mt-2 block">
                    + Insert Element
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL / DRAWER: EDIT ELEMENT CONFIG */}
      {editingElement && editingElementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Configure Element: {editingElement.type}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ID: {editingElement.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingElementTarget(null)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Element Heading / Title
                </label>
                <input
                  type="text"
                  value={editingElement.title || ''}
                  onChange={(e) =>
                    handleUpdateElementConfig(
                      editingElementTarget.sectionId,
                      editingElementTarget.columnId,
                      editingElementTarget.elementId,
                      { title: e.target.value }
                    )
                  }
                  placeholder="Optional heading..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Element Alignment
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      type="button"
                      onClick={() =>
                        handleUpdateElementConfig(
                          editingElementTarget.sectionId,
                          editingElementTarget.columnId,
                          editingElementTarget.elementId,
                          { alignment: align as any }
                        )
                      }
                      className={`py-1.5 rounded text-xs font-semibold uppercase tracking-wider border cursor-pointer ${
                        editingElement.alignment === align
                          ? 'bg-[#35123F] text-white border-[#35123F]'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific for custom_text or newsletter */}
              {(editingElement.type === 'custom_text' || editingElement.type === 'newsletter') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Text Content / Subtitle
                  </label>
                  <textarea
                    rows={3}
                    value={editingElement.content || ''}
                    onChange={(e) =>
                      handleUpdateElementConfig(
                        editingElementTarget.sectionId,
                        editingElementTarget.columnId,
                        editingElementTarget.elementId,
                        { content: e.target.value }
                      )
                    }
                    placeholder="Enter custom text..."
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs resize-none"
                  />
                </div>
              )}

              {/* Move element to another column */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Move Element to Another Column
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {sections.map((sec) =>
                    sec.columns.map((col, cIdx) => {
                      const isCurrent =
                        sec.id === editingElementTarget.sectionId &&
                        col.id === editingElementTarget.columnId;
                      if (isCurrent) return null;

                      return (
                        <button
                          key={`${sec.id}-${col.id}`}
                          type="button"
                          onClick={() => {
                            handleMoveElementToColumn(
                              editingElementTarget.sectionId,
                              editingElementTarget.columnId,
                              editingElementTarget.elementId,
                              sec.id,
                              col.id
                            );
                            setEditingElementTarget({
                              sectionId: sec.id,
                              columnId: col.id,
                              elementId: editingElementTarget.elementId,
                            });
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded bg-slate-50 hover:bg-[#35123F]/5 hover:text-[#35123F] text-xs font-medium border border-slate-200 flex items-center justify-between cursor-pointer"
                        >
                          <span>
                            {sec.title || 'Section'} → Column #{cIdx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400">Move Here →</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingElementTarget(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onSelect={(item) => {
            handleUpdateFooter({ logoUrl: typeof item === 'string' ? item : item.url });
            setShowMediaPicker(false);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
};
