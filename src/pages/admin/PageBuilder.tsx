import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
  Layers,
  Sparkles,
  Settings,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  Globe,
  FileText,
  AlertCircle,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { SectionRenderer } from '../../components/public/SectionRenderer';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { uploadAdminMedia } from '../../utils/mediaUpload';
import { registerPreviewDraftSaver, type PreviewDraftResult } from '../../utils/previewHandoff';
import type { PageRecord, PageSection, SectionType, ProductRecord } from '../../types';

interface PageOption {
  slug: string;
  label: string;
  isPublished?: boolean;
}

// Starter template factory for any internal or custom slug
export function createStarterTemplate(slug: string, label?: string): PageRecord {
  const displayTitle =
    label ||
    slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  if (slug === 'capabilities') {
    return {
      id: `page-${slug}`,
      slug,
      title: 'Capabilities & Engineering Rigor',
      metaDescription:
        'Explore enterprise architecture, zero-trust cybersecurity, high-throughput cloud clustering, and integration middleware.',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: `sec-cap-hero-${Date.now()}`,
          type: 'hero',
          title: 'Architectural & Engineering Capabilities',
          subtitle:
            'Mission-critical systems engineered for sovereign infrastructure, ultra-low latency, and resilient enterprise throughput.',
          content:
            'Designing, validating, and deploying high-availability software platforms that endure intense operational demands while safeguarding data sovereignty.',
          alignment: 'left',
          bgTreatment: 'default',
          imageUrl: '/src/assets/images/hero_tech_enterprise_1792419734209.jpg',
          imageAlt: 'Architectural Engineering',
          ctaText: 'Explore System Capabilities',
          ctaUrl: '#capabilities-grid',
        },
        {
          id: `sec-cap-stats-${Date.now() + 1}`,
          type: 'statistics',
          title: 'Benchmarked Reliability & Performance',
          subtitle: 'Empirically tested infrastructure performance metrics across enterprise deployments.',
          bgTreatment: 'surface',
          items: [
            { label: 'Uptime Guarantee', value: '99.999%', detail: 'Clustered failover SLA' },
            { label: 'Query Telemetry', value: '<45ms', detail: 'Edge-cached response' },
            { label: 'Security Baseline', value: 'Zero-Trust', detail: 'End-to-end encryption' },
            { label: 'ERP Connectors', value: '25+ Ready', detail: 'Bidirectional sync' },
          ],
        },
        {
          id: `sec-cap-grid-${Date.now() + 2}`,
          type: 'feature_grid',
          title: 'Core Architectural Capabilities',
          subtitle: 'End-to-end engineering rigor built into every system deployed.',
          bgTreatment: 'default',
          items: [
            {
              title: '01. Sovereign Data & Cloud Portability',
              description:
                'Deploy to customer-owned Kubernetes, on-premise bare metal, or managed cloud instances without vendor lock-in. Full PostgreSQL compatibility.',
            },
            {
              title: '02. Zero-Trust Security & RBAC',
              description:
                'Granular role-based access control, encrypted session authentication, parameterized query enforcement, and cryptographic data integrity.',
            },
            {
              title: '03. Bidirectional Integration Middleware',
              description:
                'Pre-engineered connectors for enterprise ERPs, biometric RFID turnstiles, hospital EHRs, banking payment networks, and third-party APIs.',
            },
            {
              title: '04. Visual No-Code CMS & Governance',
              description:
                'Empower marketing and administrative teams with visual page builders, typography palettes, and product catalog controls without code changes.',
            },
          ],
        },
        {
          id: `sec-cap-cta-${Date.now() + 3}`,
          type: 'cta',
          title: 'Ready to Benchmark Your Digital Infrastructure?',
          subtitle:
            'Engage with our principal architects for a technical architecture review and proof-of-concept deployment.',
          bgTreatment: 'burgundy-subtle',
          ctaText: 'Schedule Architecture Review',
          ctaUrl: '/contact',
        },
      ],
    };
  }

  if (slug === 'solutions') {
    return {
      id: `page-${slug}`,
      slug,
      title: 'Enterprise Solutions',
      metaDescription:
        'Turnkey enterprise platforms for high-throughput commerce, corporate learning, clinic healthcare management, and biometric facility automation.',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: `sec-sol-hero-${Date.now()}`,
          type: 'hero',
          title: 'Enterprise Solutions for Mission-Critical Velocity',
          subtitle:
            'Production-ready operational platforms engineered for seamless scalability, deep compliance, and bespoke workflow integration.',
          content:
            'Comprehensive software platforms that solve domain-specific friction in healthcare operations, omnichannel commerce, biometric facility management, and regulatory education.',
          alignment: 'left',
          bgTreatment: 'default',
          imageUrl: '/src/assets/images/hero_tech_enterprise_1792419734209.jpg',
          imageAlt: 'Enterprise Solutions',
          ctaText: 'Explore Platforms',
          ctaUrl: '/product',
        },
        {
          id: `sec-sol-prods-${Date.now() + 1}`,
          type: 'product_showcase',
          title: 'Flagship Operational Suites',
          subtitle:
            'Modular, enterprise-tested platforms ready for rapid on-premise or sovereign cloud deployment.',
          bgTreatment: 'surface',
          items: [
            { productSlug: 'gym-management' },
            { productSlug: 'e-commerce' },
            { productSlug: 'learning-management-system' },
            { productSlug: 'medicare-healthcare-management' },
          ],
        },
        {
          id: `sec-sol-grid-${Date.now() + 2}`,
          type: 'feature_grid',
          title: 'Solution Delivery Methodology',
          subtitle: 'Tailored enterprise solutions for long-term operational velocity.',
          bgTreatment: 'default',
          items: [
            {
              title: '01. Architecture Audit & Benchmarking',
              description:
                'In-depth assessment of existing tech stack, security policies, and performance bottlenecks.',
            },
            {
              title: '02. Tailored Workflow Customization',
              description:
                'Custom microservice development, database schema migration, and brand identity skinning.',
            },
            {
              title: '03. Zero-Downtime Migration',
              description:
                'Parallel staging, automated automated integration tests, and cutover protocols with rollback safety.',
            },
            {
              title: '04. Continuous Telemetry & 24/7 SLA',
              description:
                'Proactive system monitoring, automated security patch deployments, and executive advisory.',
            },
          ],
        },
        {
          id: `sec-sol-cta-${Date.now() + 3}`,
          type: 'cta',
          title: 'Deploy a Customized Enterprise Suite',
          subtitle: 'Speak directly with our solutions engineering team to evaluate requirements.',
          bgTreatment: 'gold-subtle',
          ctaText: 'Request Technical Consultation',
          ctaUrl: '/contact',
        },
      ],
    };
  }

  if (slug === 'about') {
    return {
      id: `page-${slug}`,
      slug,
      title: 'About Our Architecture',
      metaDescription:
        'Engineering principles, sovereign digital architecture, and commitment to enterprise reliability.',
      isPublished: true,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: `sec-abt-hero-${Date.now()}`,
          type: 'hero',
          title: 'Architecting Digital Foundations for High-Performance Enterprises',
          subtitle:
            'Dedicated to eliminating technical friction and building enduring digital infrastructure for ambitious organizations.',
          content:
            'Founded on the principles of zero-trust security, sovereign data control, and microservice resilience, creating enterprise platforms that withstand massive scale and evolving market landscapes.',
          alignment: 'left',
          bgTreatment: 'default',
          imageUrl: '/src/assets/images/hero_tech_enterprise_1792419734209.jpg',
          imageAlt: 'About Architecture',
          ctaText: 'Connect with Us',
          ctaUrl: '/contact',
        },
        {
          id: `sec-abt-grid-${Date.now() + 1}`,
          type: 'feature_grid',
          title: 'Our Core Engineering Principles',
          subtitle: 'The non-negotiable architectural tenets that guide every line of code shipped.',
          bgTreatment: 'surface',
          items: [
            {
              title: 'Sovereign Infrastructure First',
              description:
                'You own your data, your databases, and your hosting. We never lock clients into proprietary vendor silos.',
            },
            {
              title: 'Zero-Trust Security by Default',
              description:
                'Rigorous encryption, role-based access, and continuous automated auditing baked into the core.',
            },
            {
              title: 'Measurable Operational Velocity',
              description:
                'We measure success in reduced latency, eliminated downtime, and quantifiable business efficiency.',
            },
            {
              title: 'Partnership, Not Just Software',
              description:
                'Our senior architects remain embedded with enterprise teams from initial architecture to global scale.',
            },
          ],
        },
        {
          id: `sec-abt-stats-${Date.now() + 2}`,
          type: 'statistics',
          title: 'Operational Metrics',
          subtitle: 'Operational excellence delivered across enterprise clients.',
          bgTreatment: 'default',
          items: [
            { label: 'System Uptime', value: '99.99%', detail: 'Across all managed deployments' },
            { label: 'Active Deployments', value: '120+', detail: 'Enterprise production systems' },
            { label: 'Data Protected', value: '100TB+', detail: 'Encrypted sovereign storage' },
            { label: 'Client Satisfaction', value: '98.7%', detail: 'Long-term enterprise retention' },
          ],
        },
        {
          id: `sec-abt-cta-${Date.now() + 3}`,
          type: 'cta',
          title: 'Partner with Solutions Engineering',
          subtitle: 'Discover how architectural expertise can elevate your operational resilience.',
          bgTreatment: 'burgundy-subtle',
          ctaText: 'Schedule Executive Consultation',
          ctaUrl: '/contact',
        },
      ],
    };
  }

  // Generic Starter Template (Clean: Absolutely no hardcoded company name)
  return {
    id: `page-${slug}`,
    slug,
    title: displayTitle,
    metaDescription: `Enterprise digital architecture and mission-critical solutions for ${displayTitle.toLowerCase()}.`,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [
      {
        id: `sec-gen-hero-${Date.now()}`,
        type: 'hero',
        title: `${displayTitle}`,
        subtitle: `Scalable enterprise infrastructure and digital capabilities engineered for ${displayTitle.toLowerCase()}.`,
        content: `Delivering end-to-end mission-critical architecture, advanced security, and high-performance engineering tailored for high-demand environments.`,
        alignment: 'left',
        bgTreatment: 'default',
        imageUrl: '/src/assets/images/hero_tech_enterprise_1792419734209.jpg',
        imageAlt: `${displayTitle}`,
        ctaText: 'Schedule Consultation',
        ctaUrl: '/contact',
      },
      {
        id: `sec-gen-grid-${Date.now() + 1}`,
        type: 'feature_grid',
        title: `Key Architectural Pillars`,
        subtitle: `Core engineering rigor and enterprise features delivered through ${displayTitle.toLowerCase()}.`,
        bgTreatment: 'surface',
        items: [
          {
            title: '01. High-Availability Clustered Core',
            description:
              'Engineered for 99.99% uptime with automated zero-downtime failover and global telemetry.',
          },
          {
            title: '02. Enterprise Security & Sovereign Data',
            description:
              'Role-based access control, encrypted at-rest and in-transit records, and full audit logs.',
          },
          {
            title: '03. Bidirectional Integration API',
            description:
              'Seamlessly connects with existing legacy systems, enterprise ERPs, and cloud microservices.',
          },
          {
            title: '04. Dedicated 24/7 Enterprise Support',
            description:
              'Direct access to senior systems architects, proactive telemetry monitoring, and rapid SLA response.',
          },
        ],
      },
      {
        id: `sec-gen-cta-${Date.now() + 2}`,
        type: 'cta',
        title: `Deploy ${displayTitle}`,
        subtitle: `Consult with principal architects to design and benchmark your digital infrastructure.`,
        bgTreatment: 'default',
        ctaText: 'Speak with an Architect',
        ctaUrl: '/contact',
      },
    ],
  };
}

export const PageBuilder: React.FC = () => {
  const { token } = useAuth();
  const { editorSettings } = useTheme();

  const [currentSlug, setCurrentSlug] = useState<string>('home');
  const [pagesList, setPagesList] = useState<PageOption[]>([]);
  const [page, setPage] = useState<PageRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'hero' | 'banner'>('banner');
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');

  // Ref to hold current page state for auto-save during page transitions
  const pageRef = useRef<PageRecord | null>(null);
  pageRef.current = page;

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Build list of all available pages (combining CMS Navigation Links + existing DB pages)
  useEffect(() => {
    async function loadPagesAndProducts() {
      try {
        const headers: Record<string, string> = {};
        const activeToken = token || localStorage.getItem('ath_token');
        if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

        // 1. Fetch existing pages from backend
        let dbPages: PageRecord[] = [];
        const res = await fetch('/api/pages', { headers });
        if (res.ok) {
          dbPages = await res.json();
        }

        // 2. Fetch products
        const prodRes = await fetch('/api/products/all', { headers });
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }

        // 3. Assemble complete list
        const pageMap = new Map<string, PageOption>();

        // Always include Home
        pageMap.set('home', { slug: 'home', label: 'Home', isPublished: true });

        // Add internal pages from navigation links
        if (editorSettings?.header?.links) {
          for (const link of editorSettings.header.links) {
            if (!link.url || link.url.startsWith('http') || link.url.startsWith('mailto:')) continue;
            // Clean slug: e.g. /#capabilities -> capabilities, /product -> products/product
            let s = link.url.replace(/^\/?#?/, '').replace(/\?.*/, '').trim();
            if (s === '') s = 'home';
            if (s === 'product') s = 'products';

            if (!pageMap.has(s)) {
              pageMap.set(s, {
                slug: s,
                label: link.label || s,
                isPublished: false,
              });
            }
          }
        }

        // Add defaults if missing
        if (!pageMap.has('capabilities')) {
          pageMap.set('capabilities', { slug: 'capabilities', label: 'Capabilities', isPublished: true });
        }
        if (!pageMap.has('solutions')) {
          pageMap.set('solutions', { slug: 'solutions', label: 'Solutions', isPublished: true });
        }
        if (!pageMap.has('about')) {
          pageMap.set('about', { slug: 'about', label: 'About', isPublished: true });
        }

        // Merge actual DB pages (updates published status & titles)
        for (const p of dbPages) {
          const existing = pageMap.get(p.slug);
          const rawText = existing?.label || p.title || p.slug;
          const cleanText = rawText.replace(/^.*?\|\s*/, '').trim();
          pageMap.set(p.slug, {
            slug: p.slug,
            label: cleanText || p.slug,
            isPublished: p.isPublished,
          });
        }

        setPagesList(Array.from(pageMap.values()));
      } catch (err) {
        console.warn('Failed to load pages catalog:', err);
      }
    }

    loadPagesAndProducts();
  }, [token, JSON.stringify(editorSettings?.header?.links || [])]);

  // Load active page data
  const loadPageBySlug = async (targetSlug: string) => {
    setIsPageLoading(true);
    try {
      const headers: Record<string, string> = {};
      const activeToken = token || localStorage.getItem('ath_token');
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`/api/pages/${targetSlug}?draft=true`, { headers });
      if (res.ok) {
        const data: PageRecord = await res.json();
        if (data.title && data.title.includes('|')) {
          data.title = data.title.replace(/^.*?\|\s*/, '').trim();
        }
        setPage(data);
        setSelectedSectionId((prev) => {
          if (prev && data.sections.some((s) => s.id === prev)) return prev;
          return data.sections.length > 0 ? data.sections[0].id : null;
        });
        setIsDirty(false);
      } else if (res.status === 404) {
        // Page doesn't exist yet -> generate tailored starter template & persist draft
        const targetOption = pagesList.find((p) => p.slug === targetSlug);
        const starter = createStarterTemplate(targetSlug, targetOption?.label);

        // Save initial draft
        if (activeToken) {
          await fetch(`/api/pages/${targetSlug}/draft`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeToken}`,
            },
            body: JSON.stringify(starter),
          });
        }

        setPage(starter);
        if (starter.sections.length > 0) {
          setSelectedSectionId(starter.sections[0].id);
        }
        setIsDirty(false);
        setFeedback(`Loaded customizable starter template for /${targetSlug}`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.warn(`Error loading page ${targetSlug}:`, err);
    } finally {
      setIsPageLoading(false);
    }
  };

  // Initial load for currentSlug
  useEffect(() => {
    loadPageBySlug(currentSlug);
  }, [currentSlug, token]);

  // Auto-save draft before switching pages
  const handleSwitchPage = async (newSlug: string) => {
    if (newSlug === currentSlug) return;

    if (isDirtyRef.current && pageRef.current) {
      try {
        const activeToken = token || localStorage.getItem('ath_token');
        await fetch(`/api/pages/${pageRef.current.slug}/draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
          },
          body: JSON.stringify(pageRef.current),
        });
      } catch (err) {
        console.warn('Auto-save on switch error:', err);
      }
    }

    setCurrentSlug(newSlug);
  };

  // Create new page modal action
  const handleCreatePage = async () => {
    const rawTitle = newPageTitle.trim();
    let rawSlug = newPageSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    if (!rawSlug && rawTitle) {
      rawSlug = rawTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }

    if (!rawSlug) {
      alert('Please enter a valid page slug or title.');
      return;
    }

    // Check if exists
    if (pagesList.some((p) => p.slug === rawSlug)) {
      alert(`A page with slug "/${rawSlug}" already exists.`);
      handleSwitchPage(rawSlug);
      setShowNewPageModal(false);
      return;
    }

    const starter = createStarterTemplate(rawSlug, rawTitle);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const createRes = await fetch(`/api/pages/${rawSlug}/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
        body: JSON.stringify(starter),
      });

      if (!createRes.ok) {
        const createErr = await createRes.json().catch(() => null);
        const errorText = createErr?.error || await createRes.text().catch(() => 'Failed to create the page - nothing was saved');
        setFeedbackIsError(true);
        setFeedback(errorText);
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      setPagesList((prev) => [...prev, { slug: rawSlug, label: rawTitle || rawSlug, isPublished: false }]);
      setShowNewPageModal(false);
      setNewPageTitle('');
      setNewPageSlug('');
      setCurrentSlug(rawSlug);
    } catch {
      setFeedbackIsError(true);
      setFeedback('Failed to initialize new page.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeletePage = async () => {
    if (currentSlug === 'home') {
      alert('The default homepage cannot be deleted.');
      return;
    }

    if (!confirm(`Are you sure you want to delete the page "/${currentSlug}"? This action is permanent.`)) {
      return;
    }

    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const res = await fetch(`/api/pages/${currentSlug}`, {
        method: 'DELETE',
        headers: {
          ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
        },
      });

      if (res.ok) {
        setPagesList((prev) => prev.filter((p) => p.slug !== currentSlug));
        setCurrentSlug('home');
        setFeedback('Page deleted successfully');
        setTimeout(() => setFeedback(null), 2500);
      } else {
        alert('Could not delete page.');
      }
    } catch {
      alert('Delete request failed.');
    }
  };

  const handleUpdateSection = (id: string, updates: Partial<PageSection>) => {
    if (!page) return;
    const updatedSections = page.sections.map((s) => (s.id === id ? { ...s, ...updates } : s));
    setPage({ ...page, sections: updatedSections });
    setIsDirty(true);
  };

  const handleAddSection = (type: SectionType) => {
    if (!page) return;
    const newSec: PageSection = {
      id: 'sec-' + Date.now(),
      type,
      title: `New ${type.replace('_', ' ').toUpperCase()} Section`,
      subtitle: 'Customizable enterprise subtitle description.',
      bgTreatment: 'default',
      items:
        type === 'feature_grid'
          ? [
              { title: '01. Enterprise Module', description: 'Detailed module description.' },
              { title: '02. Telemetry Ingestion', description: 'Detailed telemetry description.' },
            ]
          : type === 'statistics'
          ? [
              { label: 'Uptime', value: '99.99%', detail: 'SLA Guarantee' },
              { label: 'Throughput', value: '10k req/s', detail: 'Edge processed' },
            ]
          : [],
    };
    const updated = [...page.sections, newSec];
    setPage({ ...page, sections: updated });
    setSelectedSectionId(newSec.id);
    setIsDirty(true);
  };

  const handleDuplicate = (sec: PageSection) => {
    if (!page) return;
    const copy: PageSection = {
      ...JSON.parse(JSON.stringify(sec)),
      id: 'sec-' + Date.now(),
      title: `${sec.title} (Copy)`,
    };
    const idx = page.sections.findIndex((s) => s.id === sec.id);
    const updated = [...page.sections];
    updated.splice(idx + 1, 0, copy);
    setPage({ ...page, sections: updated });
    setSelectedSectionId(copy.id);
    setIsDirty(true);
  };

  const handleDeleteSection = (id: string) => {
    if (!page) return;
    if (page.sections.length <= 1) {
      alert('A page must contain at least one section.');
      return;
    }
    const target = page.sections.find((s) => s.id === id);
    if (
      target &&
      !confirm(
        `Delete the "${target.title || target.type}" section and all of its content? This affects the published page once you publish.`
      )
    ) {
      return;
    }
    const updated = page.sections.filter((s) => s.id !== id);
    setPage({ ...page, sections: updated });
    setSelectedSectionId(updated[0]?.id || null);
    setIsDirty(true);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!page) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= page.sections.length) return;

    const updated = [...page.sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setPage({ ...page, sections: updated });
    setIsDirty(true);
  };

  const handleToggleHide = (sec: PageSection) => {
    handleUpdateSection(sec.id, { isHidden: !sec.isHidden });
  };

  const handleUploadSectionImage = async (e: React.ChangeEvent<HTMLInputElement>, secId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const result = await uploadAdminMedia(file, { token });
      if (result.ok) {
        handleUpdateSection(secId, { imageUrl: result.media.url, videoUrl: '' });
        setFeedbackIsError(false);
        setFeedback('Image uploaded successfully');
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
      }
    } finally {
      setUploadingImg(false);
    }
  };

  const handleUploadSectionVideo = async (e: React.ChangeEvent<HTMLInputElement>, secId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const result = await uploadAdminMedia(file, { token });
      if (result.ok) {
        handleUpdateSection(secId, { videoUrl: result.media.url, imageUrl: '' });
        setFeedbackIsError(false);
        setFeedback('Video uploaded successfully');
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
      }
    } finally {
      setUploadingImg(false);
    }
  };

  const handleUploadBannerImage = async (e: React.ChangeEvent<HTMLInputElement>, secId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const result = await uploadAdminMedia(file, { token });
      if (result.ok) {
        const isVideo = result.media.mediaType === 'video';
        handleUpdateSection(
          secId,
          isVideo
            ? { bannerVideoUrl: result.media.url, bannerImageUrl: '' }
            : { bannerImageUrl: result.media.url, bannerVideoUrl: '' }
        );
        setFeedbackIsError(false);
        setFeedback(`Banner ${isVideo ? 'video' : 'image'} uploaded successfully`);
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
      }
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!page) return false;
    setIsSaving(true);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`/api/pages/${page.slug}/draft`, {
        method: 'POST',
        headers,
        body: JSON.stringify(page),
      });
      if (res.ok) {
        setIsDirty(false);
        setFeedbackIsError(false);
        setFeedback('Draft saved permanently');
        setTimeout(() => setFeedback(null), 2500);
        return true;
      }
      const err = await res.json().catch(() => null);
      const errorText = err?.error || await res.text().catch(() => 'Draft save failed - nothing was changed');
      setFeedbackIsError(true);
      setFeedback(errorText);
      setTimeout(() => setFeedback(null), 4000);
      return false;
    } catch {
      setFeedbackIsError(true);
      setFeedback('Failed to save draft');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!page) return;

    // Open the tab synchronously so popup blockers allow it, then save the
    // current page draft before navigating the tab to the preview URL.
    const previewWindow = window.open('about:blank', '_blank');
    if (previewWindow) previewWindow.opener = null;

    setIsPreviewing(true);
    try {
      const saved = await handleSaveDraft();
      if (!saved) {
        previewWindow?.close();
        return;
      }

      const target = page.slug === 'home' ? '/' : `/${page.slug}`;
      const previewUrl = new URL(target, window.location.origin);
      previewUrl.searchParams.set('preview', 'draft');

      if (previewWindow) {
        previewWindow.location.replace(previewUrl.toString());
      } else {
        window.location.href = previewUrl.toString();
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const saveDraftForPreview = async (): Promise<PreviewDraftResult> => {
    if (!page) return { saved: true };
    const saved = await handleSaveDraft();
    if (!saved) return { saved: false };
    return {
      saved: true,
      path: page.slug === 'home' ? '/' : `/${page.slug}`,
    };
  };

  useEffect(
    () => registerPreviewDraftSaver(saveDraftForPreview),
    // Re-register when the active page or auth token changes so the global
    // preview button always saves the page currently being edited.
    [page, token]
  );

  const handlePublish = async () => {
    if (!page) return;
    setIsSaving(true);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      // Save draft first. Publishing must never promote a stale draft, so a
      // failed draft save aborts the publish instead of going live with old content.
      const draftRes = await fetch(`/api/pages/${page.slug}/draft`, {
        method: 'POST',
        headers,
        body: JSON.stringify(page),
      });
      if (!draftRes.ok) {
        const draftErr = await draftRes.json().catch(() => null);
        setFeedbackIsError(true);
        setFeedback(
          draftErr?.error || 'Draft save failed - publish aborted so no stale content goes live'
        );
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      // Publish
      const authHeader: Record<string, string> = {};
      if (activeToken) authHeader['Authorization'] = `Bearer ${activeToken}`;
      const res = await fetch(`/api/pages/${page.slug}/publish`, {
        method: 'POST',
        headers: authHeader,
      });
      if (res.ok) {
        setIsDirty(false);
        setPage({ ...page, isPublished: true });
        setPagesList((prev) =>
          prev.map((p) => (p.slug === page.slug ? { ...p, isPublished: true } : p))
        );
        setFeedbackIsError(false);
        setFeedback('Page published live to website!');
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const pubErr = await res.json().catch(() => null);
        const errorText = pubErr?.error || await res.text().catch(() => 'Publish failed - the page was not published');
        setFeedbackIsError(true);
        setFeedback(errorText);
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Publish error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSection = page?.sections.find((s) => s.id === selectedSectionId);

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-4 rounded-xl shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#35123F]" />
              <span>Page Studio</span>
            </h2>

            {/* Dynamic Page Selection Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Page:
              </span>
              <select
                value={currentSlug}
                onChange={(e) => handleSwitchPage(e.target.value)}
                disabled={isPageLoading || isSaving}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-1"
              >
                {pagesList.map((p) => {
                  let cleanLabel = (p.label || p.slug).replace(/^.*?\|\s*/, '').trim();
                  cleanLabel = cleanLabel.replace(/\s*\(Homepage\)/gi, '').trim();
                  const suffix = p.slug === 'home' ? '(Homepage)' : `(/${p.slug})`;
                  return (
                    <option key={p.slug} value={p.slug}>
                      {cleanLabel} {suffix}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={() => setShowNewPageModal(true)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Create new internal navigation page"
            >
              <Plus className="w-3.5 h-3.5 text-[#35123F]" />
              <span>New Page</span>
            </button>

            <button
              onClick={() => setShowSeoModal(true)}
              className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
              title="Edit Page SEO & Meta Title"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>SEO</span>
            </button>

            {isDirty && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                Unsaved Edits
              </span>
            )}

            {page?.isPublished ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                Live
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-300">
                Draft Only
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Editing: <strong className="text-slate-800 font-mono">/{currentSlug === 'home' ? '' : currentSlug}</strong>
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={handleOpenPreview}
              disabled={isPreviewing || isSaving || !page}
              data-testid="page-preview-draft"
              className="inline-flex items-center gap-1 text-[#35123F] hover:underline font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{isPreviewing ? 'Saving Draft...' : 'Preview Draft'}</span>
            </button>
            {currentSlug !== 'home' && (
              <>
                <span>·</span>
                <button
                  onClick={handleDeletePage}
                  className="text-rose-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Page</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {feedback && (
            <span
              className={
                feedbackIsError
                  ? 'text-xs bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-rose-200'
                  : 'text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-emerald-200'
              }
            >
              {feedbackIsError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {feedback}
            </span>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isPageLoading || !page}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isSaving || isPageLoading || !page}
            className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Publish Live'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Frame */}
      {isPageLoading && !page ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-3">
            Loading Page Studio...
          </p>
        </div>
      ) : page ? (
        <div className="grid grid-cols-1 gap-5 lg:h-[calc(100vh-15rem)] lg:min-h-[560px] lg:grid-cols-12 lg:items-stretch lg:overflow-hidden xl:grid-cols-[240px_minmax(0,1fr)_400px]">
          {/* Left Column: Section Library & Outline */}
          <div className="min-h-0 space-y-4 lg:col-span-3 lg:h-full lg:overflow-y-auto lg:pr-1 xl:col-span-1">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sections Outline ({page.sections.length})
                </span>
              </div>

              <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 lg:max-h-none">
                {page.sections.map((sec, idx) => {
                  const active = sec.id === selectedSectionId;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        active
                          ? 'border-[#35123F] bg-[#35123F]/5 font-semibold text-[#35123F]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        <span className="truncate">{sec.title || sec.type}</span>
                      </div>

                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === page.sections.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleToggleHide(sec)}
                          className={`p-1 cursor-pointer ${
                            sec.isHidden ? 'text-amber-600' : 'text-slate-400 hover:text-slate-800'
                          }`}
                          title={sec.isHidden ? 'Show Section' : 'Hide Section'}
                        >
                          {sec.isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Section Library */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Add Section
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { type: 'hero', label: '+ Hero' },
                  { type: 'statistics', label: '+ Statistics' },
                  { type: 'product_showcase', label: '+ Products' },
                  { type: 'feature_grid', label: '+ Features' },
                  { type: 'testimonials', label: '+ Testimonials' },
                  { type: 'cta', label: '+ CTA Banner' },
                  { type: 'rich_text', label: '+ Rich Text' },
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => handleAddSection(btn.type as SectionType)}
                    className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left font-medium text-slate-700 hover:text-[#35123F] cursor-pointer transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: Central Live Page Preview */}
          <div className="flex min-h-0 flex-col rounded-2xl border border-slate-300 bg-slate-200/70 p-4 lg:col-span-6 lg:h-full lg:overflow-hidden xl:col-span-1">
            <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 px-2 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Interactive Live Preview
              </span>
              <span>Click a section to edit its settings</span>
            </div>

            <div className="cms-public-preview max-h-[780px] min-h-[520px] flex-1 space-y-2 overflow-y-auto rounded-xl border border-slate-300 bg-[#FAF7F2] shadow-inner lg:min-h-0 lg:max-h-none">
              {page.sections.map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`relative cursor-pointer transition-all ${
                    sec.id === selectedSectionId
                      ? 'ring-3 ring-[#35123F] ring-offset-2'
                      : 'hover:opacity-90'
                  }`}
                >
                  {sec.isHidden && (
                    <div className="absolute top-2 right-2 z-20 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Hidden from public
                    </div>
                  )}
                  <SectionRenderer section={sec} products={products} />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Settings Panel for Selected Section */}
          <div className="min-h-0 lg:col-span-3 lg:h-full lg:overflow-y-auto lg:pr-1 xl:col-span-1">
            {selectedSection ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:min-h-full">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Section Settings
                    </h3>
                    <p className="text-[11px] text-[#35123F] font-semibold uppercase">
                      Type: {selectedSection.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(selectedSection)}
                      className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                      title="Duplicate Section"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSection(selectedSection.id)}
                      className="p-1 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 1. Headline & Typography Section */}
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#35123F]" />
                      Headline & Typography
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Section Headline
                    </label>
                    <input
                      type="text"
                      value={selectedSection.title || ''}
                      onChange={(e) => handleUpdateSection(selectedSection.id, { title: e.target.value })}
                      placeholder="Section title"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-[#35123F] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Section Subtitle
                    </label>
                    <textarea
                      rows={2}
                      value={selectedSection.subtitle || ''}
                      onChange={(e) =>
                        handleUpdateSection(selectedSection.id, { subtitle: e.target.value })
                      }
                      placeholder="Supporting text for this section..."
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-[#35123F] outline-none resize-none"
                    />
                  </div>

                  {/* Alignment buttons */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Text Alignment
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { val: 'left', icon: AlignLeft, label: 'Left' },
                        { val: 'center', icon: AlignCenter, label: 'Center' },
                        { val: 'right', icon: AlignRight, label: 'Right' },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = (selectedSection.alignment || 'left') === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => handleUpdateSection(selectedSection.id, { alignment: item.val as any })}
                            className={`py-1.5 px-2 rounded border text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#35123F] text-white border-[#35123F]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title Size & Weight */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Title Size
                      </label>
                      <select
                        value={selectedSection.titleSize || 'lg'}
                        onChange={(e) => handleUpdateSection(selectedSection.id, { titleSize: e.target.value as any })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="sm">Small (2xl)</option>
                        <option value="base">Medium (3xl)</option>
                        <option value="lg">Large (4xl)</option>
                        <option value="xl">Extra Large (5xl)</option>
                        <option value="2xl">Massive (6xl)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Title Weight
                      </label>
                      <select
                        value={selectedSection.titleWeight || 'bold'}
                        onChange={(e) => handleUpdateSection(selectedSection.id, { titleWeight: e.target.value as any })}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="normal">Normal (400)</option>
                        <option value="medium">Medium (500)</option>
                        <option value="semibold">Semi-Bold (600)</option>
                        <option value="bold">Bold (700)</option>
                        <option value="extrabold">Extra-Bold (800)</option>
                      </select>
                    </div>
                  </div>

                  {/* Title Color & Subtitle Color */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Title Color
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedSection.titleColor || '#171B2C'}
                          onChange={(e) => handleUpdateSection(selectedSection.id, { titleColor: e.target.value })}
                          className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedSection.titleColor || '#171B2C'}
                          onChange={(e) => handleUpdateSection(selectedSection.id, { titleColor: e.target.value })}
                          className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Subtitle Color
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={selectedSection.subtitleColor || '#334155'}
                          onChange={(e) => handleUpdateSection(selectedSection.id, { subtitleColor: e.target.value })}
                          className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedSection.subtitleColor || '#334155'}
                          onChange={(e) => handleUpdateSection(selectedSection.id, { subtitleColor: e.target.value })}
                          className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vertical Padding */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Vertical Padding
                    </label>
                    <select
                      value={selectedSection.paddingY || 'normal'}
                      onChange={(e) => handleUpdateSection(selectedSection.id, { paddingY: e.target.value as any })}
                      className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                    >
                      <option value="compact">Compact (py-12)</option>
                      <option value="normal">Standard (py-20)</option>
                      <option value="relaxed">Spacious (py-28)</option>
                    </select>
                  </div>
                </div>

                {/* 2. Background Surface & Banner Modes */}
                <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-[#35123F]" />
                      Background & Banner
                    </span>
                  </div>

                  {/* 3 Selectable Modes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Background Mode
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'surface', label: '1. Surface' },
                        { id: 'image', label: '2. Banner' },
                        { id: 'image-gradient', label: '3. Overlay' },
                      ].map((m) => {
                        const currentMode =
                          selectedSection.bgMode ||
                          (selectedSection.bannerImageUrl || selectedSection.bannerVideoUrl ? 'image' : 'surface');
                        const isSelected = currentMode === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleUpdateSection(selectedSection.id, { bgMode: m.id as any })}
                            className={`py-1.5 px-1 rounded border text-[11px] font-semibold text-center cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#35123F] text-white border-[#35123F]'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* MODE 1: Surface Only */}
                  {(selectedSection.bgMode === 'surface' ||
                    (!selectedSection.bgMode &&
                      !selectedSection.bannerImageUrl &&
                      !selectedSection.bannerVideoUrl)) && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Surface Theme Preset
                        </label>
                        <select
                          value={selectedSection.bgTreatment || 'default'}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, {
                              bgTreatment: e.target.value as any,
                              bgSurfaceColor: '',
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white"
                        >
                          <option value="default">Default Ivory (#FAF7F2)</option>
                          <option value="surface">Crisp White Surface</option>
                          <option value="burgundy-subtle">Subtle Deep Plum Tint</option>
                          <option value="gold-subtle">Subtle Gold Accent</option>
                          <option value="gradient">Clean Subtle Gradient</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Custom Solid Color
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={selectedSection.bgSurfaceColor || '#FAF7F2'}
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  bgSurfaceColor: e.target.value,
                                })
                              }
                              className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={selectedSection.bgSurfaceColor || ''}
                              placeholder="#FAF7F2"
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  bgSurfaceColor: e.target.value,
                                })
                              }
                              className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Gradient (From / To)
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="color"
                              value={selectedSection.bgGradientFrom || '#FAF7F2'}
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  bgGradientFrom: e.target.value,
                                  bgSurfaceColor: '',
                                })
                              }
                              className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                              title="Gradient From"
                            />
                            <input
                              type="color"
                              value={selectedSection.bgGradientTo || '#FFFFFF'}
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  bgGradientTo: e.target.value,
                                  bgSurfaceColor: '',
                                })
                              }
                              className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                              title="Gradient To"
                            />
                            <select
                              value={selectedSection.bgGradientAngle ?? 135}
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  bgGradientAngle: Number(e.target.value),
                                })
                              }
                              className="w-full px-1 py-1 border border-slate-300 rounded text-[11px] bg-white"
                            >
                              <option value="90">90°</option>
                              <option value="135">135°</option>
                              <option value="180">180°</option>
                              <option value="45">45°</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODE 2 & MODE 3: Banner Image & Gradient Overlay */}
                  {(selectedSection.bgMode === 'image' || selectedSection.bgMode === 'image-gradient') && (
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Banner Background (Image, Video, or URL)
                        </label>
                        <div className="flex flex-col gap-1.5">
                          <input
                            type="text"
                            value={selectedSection.bannerImageUrl || selectedSection.bannerVideoUrl || ''}
                            onChange={(e) => {
                              const url = e.target.value.trim();
                              const isVideo = /\.(mp4|webm|mov)(?:$|[?#])/i.test(url);
                              handleUpdateSection(
                                selectedSection.id,
                                isVideo
                                  ? { bannerVideoUrl: url, bannerImageUrl: '' }
                                  : { bannerImageUrl: url, bannerVideoUrl: '' }
                              );
                            }}
                            placeholder="Enter image or video URL"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-[#35123F] outline-none"
                          />
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setMediaPickerTarget('banner');
                                setShowMediaPicker(true);
                              }}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer border border-slate-300 transition-colors"
                            >
                              <ImageIcon className="w-3 h-3 text-[#35123F]" />
                              <span>Select Image or Video</span>
                            </button>
                            <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors">
                              <Upload className="w-3 h-3 text-[#D5A13C]" />
                              <span>{uploadingImg ? '...' : 'Upload'}</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                                onChange={(e) => handleUploadBannerImage(e, selectedSection.id)}
                                disabled={uploadingImg}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {(selectedSection.bannerImageUrl || selectedSection.bannerVideoUrl) && (
                          <div className="mt-1.5 p-1.5 bg-white border border-slate-200 rounded flex items-center justify-between text-[11px]">
                            {selectedSection.bannerVideoUrl ||
                            /\.(mp4|webm|mov)(?:$|[?#])/i.test(selectedSection.bannerImageUrl || '') ? (
                              <video
                                src={selectedSection.bannerVideoUrl || selectedSection.bannerImageUrl}
                                muted
                                autoPlay
                                loop
                                playsInline
                                className="w-12 h-8 object-cover rounded border border-slate-200"
                              />
                            ) : (
                              <img
                                src={selectedSection.bannerImageUrl}
                                alt="Banner preview"
                                className="w-12 h-8 object-cover rounded border border-slate-200"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSection(selectedSection.id, {
                                  bannerImageUrl: '',
                                  bannerVideoUrl: '',
                                })
                              }
                              className="text-rose-600 hover:underline font-semibold"
                            >
                              Remove Banner
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Positioning & Opacity */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Image Alignment
                          </label>
                          <select
                            value={selectedSection.bannerImagePosition || 'center'}
                            onChange={(e) =>
                              handleUpdateSection(selectedSection.id, {
                                bannerImagePosition: e.target.value as any,
                              })
                            }
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="center">Center</option>
                            <option value="top">Top</option>
                            <option value="bottom">Bottom</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex justify-between">
                            <span>Image Opacity</span>
                            <span className="font-mono text-slate-500">
                              {selectedSection.bannerImageOpacity ?? 100}%
                            </span>
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={selectedSection.bannerImageOpacity ?? 100}
                            onChange={(e) =>
                              handleUpdateSection(selectedSection.id, {
                                bannerImageOpacity: Number(e.target.value),
                              })
                            }
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#35123F]"
                          />
                        </div>
                      </div>

                      {/* Mode 3 Gradient Overlay Controls */}
                      {selectedSection.bgMode === 'image-gradient' && (
                        <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-2">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            Gradient Overlay Styling
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                Gradient From
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={selectedSection.bgGradientFrom || '#171B2C'}
                                  onChange={(e) =>
                                    handleUpdateSection(selectedSection.id, {
                                      bgGradientFrom: e.target.value,
                                    })
                                  }
                                  className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={selectedSection.bgGradientFrom || '#171B2C'}
                                  onChange={(e) =>
                                    handleUpdateSection(selectedSection.id, {
                                      bgGradientFrom: e.target.value,
                                    })
                                  }
                                  className="w-full px-1 py-0.5 border border-slate-300 rounded text-[10px] font-mono bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                Gradient To
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="color"
                                  value={selectedSection.bgGradientTo || '#35123F'}
                                  onChange={(e) =>
                                    handleUpdateSection(selectedSection.id, {
                                      bgGradientTo: e.target.value,
                                    })
                                  }
                                  className="w-6 h-6 p-0 rounded border border-slate-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={selectedSection.bgGradientTo || '#35123F'}
                                  onChange={(e) =>
                                    handleUpdateSection(selectedSection.id, {
                                      bgGradientTo: e.target.value,
                                    })
                                  }
                                  className="w-full px-1 py-0.5 border border-slate-300 rounded text-[10px] font-mono bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                                Gradient Angle
                              </label>
                              <select
                                value={selectedSection.bgGradientAngle ?? 135}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, {
                                    bgGradientAngle: Number(e.target.value),
                                  })
                                }
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                              >
                                <option value="0">0° (Up)</option>
                                <option value="45">45° (Top Right)</option>
                                <option value="90">90° (Right)</option>
                                <option value="135">135° (Bottom Right)</option>
                                <option value="180">180° (Down)</option>
                                <option value="225">225° (Bottom Left)</option>
                                <option value="270">270° (Left)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex justify-between">
                                <span>Overlay Opacity</span>
                                <span className="font-mono text-slate-500">
                                  {selectedSection.bgOverlayOpacity ?? 75}%
                                </span>
                              </label>
                              <input
                                type="range"
                                min="10"
                                max="95"
                                step="5"
                                value={selectedSection.bgOverlayOpacity ?? 75}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, {
                                    bgOverlayOpacity: Number(e.target.value),
                                  })
                                }
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#35123F]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hero Specific */}
                {selectedSection.type === 'hero' && (
                  <>
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <label className="block text-xs font-semibold text-slate-700">
                        Hero Media (Image or Video)
                      </label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={selectedSection.imageUrl || selectedSection.videoUrl || ''}
                          onChange={(e) => {
                            const url = e.target.value;
                            const isVideo = /\.(mp4|webm|mov)(?:$|[?#])/i.test(url);
                            if (isVideo) {
                              handleUpdateSection(selectedSection.id, { videoUrl: url, imageUrl: '' });
                            } else {
                              handleUpdateSection(selectedSection.id, { imageUrl: url, videoUrl: '' });
                            }
                          }}
                          placeholder="Enter image or video URL"
                          className="w-full min-w-0 px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-[#35123F] outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMediaPickerTarget('hero');
                              setShowMediaPicker(true);
                            }}
                            className="flex-1 justify-center px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-300 transition-colors"
                          >
                            <ImageIcon className="w-3 h-3 text-[#35123F]" />
                            <span>Media</span>
                          </button>
                          <label className="flex-1 justify-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors">
                            <Upload className="w-3 h-3 text-[#D5A13C]" />
                            <span>{uploadingImg ? '...' : 'Upload'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const isVideo = file.type.startsWith('video/');
                                  if (isVideo) {
                                    handleUploadSectionVideo(e, selectedSection.id);
                                  } else {
                                    handleUploadSectionImage(e, selectedSection.id);
                                  }
                                }
                              }}
                              disabled={uploadingImg}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                      {(selectedSection.imageUrl || selectedSection.videoUrl) && (
                        <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center justify-between text-[11px]">
                          {selectedSection.videoUrl ||
                          /\.(mp4|webm|mov)(?:$|[?#])/i.test(selectedSection.imageUrl || '') ? (
                            <video
                              src={selectedSection.videoUrl || selectedSection.imageUrl}
                              muted
                              autoPlay
                              loop
                              playsInline
                              className="w-10 h-7 object-cover rounded border border-slate-200"
                            />
                          ) : (
                            <img
                              src={selectedSection.imageUrl}
                              alt="Section preview"
                              className="w-10 h-7 object-cover rounded border border-slate-200"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleUpdateSection(selectedSection.id, { imageUrl: '', videoUrl: '' })}
                            className="text-rose-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Hero Paragraph Content
                      </label>
                      <textarea
                        rows={3}
                        value={selectedSection.content || ''}
                        onChange={(e) =>
                          handleUpdateSection(selectedSection.id, { content: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-[#35123F] outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Primary CTA Text
                      </label>
                      <input
                        type="text"
                        value={selectedSection.ctaText || ''}
                        onChange={(e) =>
                          handleUpdateSection(selectedSection.id, { ctaText: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Primary CTA URL
                      </label>
                      <input
                        type="text"
                        value={selectedSection.ctaUrl || ''}
                        onChange={(e) =>
                          handleUpdateSection(selectedSection.id, { ctaUrl: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="block text-[11px] font-bold text-slate-700">
                        Eyebrow &amp; Heading
                      </span>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Eyebrow Text
                        </label>
                        <input
                          type="text"
                          value={selectedSection.eyebrowText || ''}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, { eyebrowText: e.target.value })
                          }
                          placeholder="e.g. Enterprise AI Infrastructure"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Eyebrow Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedSection.eyebrowColor || '#35123F'}
                            onChange={(e) =>
                              handleUpdateSection(selectedSection.id, { eyebrowColor: e.target.value })
                            }
                            className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedSection.eyebrowColor || '#35123F'}
                            onChange={(e) =>
                              handleUpdateSection(selectedSection.id, { eyebrowColor: e.target.value })
                            }
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Second Heading Line
                        </label>
                        <input
                          type="text"
                          value={selectedSection.titleLine2 || ''}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, { titleLine2: e.target.value })
                          }
                          placeholder="Optional second line"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Second Line Color
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedSection.titleLine2Color || selectedSection.titleColor || '#D5A13C'}
                            onChange={(e) =>
                              handleUpdateSection(selectedSection.id, { titleLine2Color: e.target.value })
                            }
                            className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={selectedSection.titleLine2Color || selectedSection.titleColor || '#D5A13C'}
                            onChange={(e) =>
                              handleUpdateSection(selectedSection.id, { titleLine2Color: e.target.value })
                            }
                            className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(selectedSection.titleGradient)}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, { titleGradient: e.target.checked })
                          }
                        />
                        Gradient heading text
                      </label>
                      {selectedSection.titleGradient && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Gradient From
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={selectedSection.titleGradientFrom || '#35123F'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { titleGradientFrom: e.target.value })
                                }
                                className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.titleGradientFrom || '#35123F'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { titleGradientFrom: e.target.value })
                                }
                                className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Gradient To
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={selectedSection.titleGradientTo || '#D5A13C'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { titleGradientTo: e.target.value })
                                }
                                className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.titleGradientTo || '#D5A13C'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { titleGradientTo: e.target.value })
                                }
                                className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Gradient Angle (°)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={360}
                              value={selectedSection.titleGradientAngle ?? 135}
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  titleGradientAngle: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="block text-[11px] font-bold text-slate-700">
                        Secondary Button
                      </span>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={selectedSection.secondaryCtaText || ''}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, { secondaryCtaText: e.target.value })
                          }
                          placeholder="e.g. Learn More"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Button URL
                        </label>
                        <input
                          type="text"
                          value={selectedSection.secondaryCtaUrl || ''}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, { secondaryCtaUrl: e.target.value })
                          }
                          placeholder="#contact"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="block text-[11px] font-bold text-slate-700">
                        Hero Animation Style
                      </span>
                      <p className="text-[10px] leading-relaxed text-slate-500">
                        Static image or video is the default hero visual. Animated orbitals remain
                        available as an optional replacement; banner backgrounds remain intact.
                      </p>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Visual Style
                        </label>
                        <select
                          value={selectedSection.heroVisual || 'media'}
                          onChange={(e) =>
                            handleUpdateSection(selectedSection.id, {
                              heroVisual: e.target.value as PageSection['heroVisual'],
                            })
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white"
                          aria-label="Hero animation style"
                        >
                          <option value="media">Static Image / Video (Default)</option>
                          <option value="orbital-spheres">Animated 3D Spheres</option>
                        </select>
                      </div>
                      {selectedSection.heroVisual === 'orbital-spheres' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Sphere Color
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={selectedSection.orbitalPrimaryColor || '#35123F'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { orbitalPrimaryColor: e.target.value })
                                }
                                className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.orbitalPrimaryColor || '#35123F'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { orbitalPrimaryColor: e.target.value })
                                }
                                className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Accent Color
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={selectedSection.orbitalAccentColor || '#D5A13C'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { orbitalAccentColor: e.target.value })
                                }
                                className="w-7 h-7 p-0.5 rounded border border-slate-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={selectedSection.orbitalAccentColor || '#D5A13C'}
                                onChange={(e) =>
                                  handleUpdateSection(selectedSection.id, { orbitalAccentColor: e.target.value })
                                }
                                className="w-full px-1.5 py-1 border border-slate-300 rounded text-[11px] font-mono bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Float Speed ({selectedSection.orbitalSpeedSeconds ?? 14}s)
                            </label>
                            <input
                              type="range"
                              min={4}
                              max={40}
                              step={1}
                              value={selectedSection.orbitalSpeedSeconds ?? 14}
                              onChange={(e) =>
                                handleUpdateSection(selectedSection.id, {
                                  orbitalSpeedSeconds: Number(e.target.value),
                                })
                              }
                              className="w-full accent-[#35123F]"
                            />
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-500">
                            Motion automatically stops for visitors who prefer reduced motion.
                            Lower the float speed for a calmer hero.
                          </p>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Feature Grid Specific */}
                {selectedSection.type === 'feature_grid' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Feature Items</label>
                      <button
                        type="button"
                        onClick={() => {
                          const items = selectedSection.items || [];
                          handleUpdateSection(selectedSection.id, {
                            items: [
                              ...items,
                              {
                                title: `0${items.length + 1}. Architectural Capability`,
                                description: 'Enterprise capability description.',
                              },
                            ],
                          });
                        }}
                        className="text-[11px] text-[#35123F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {(selectedSection.items || []).map((item: any, itemIdx: number) => (
                        <div
                          key={itemIdx}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 text-[10px]">
                              Item #{itemIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const items = [...(selectedSection.items || [])];
                                items.splice(itemIdx, 1);
                                handleUpdateSection(selectedSection.id, { items });
                              }}
                              className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.title || ''}
                            onChange={(e) => {
                              const items = [...(selectedSection.items || [])];
                              items[itemIdx] = { ...items[itemIdx], title: e.target.value };
                              handleUpdateSection(selectedSection.id, { items });
                            }}
                            placeholder="Feature Title"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                          <textarea
                            rows={2}
                            value={item.description || ''}
                            onChange={(e) => {
                              const items = [...(selectedSection.items || [])];
                              items[itemIdx] = { ...items[itemIdx], description: e.target.value };
                              handleUpdateSection(selectedSection.id, { items });
                            }}
                            placeholder="Feature Description"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics Specific */}
                {selectedSection.type === 'statistics' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Metrics & KPIs</label>
                      <button
                        type="button"
                        onClick={() => {
                          const items = selectedSection.items || [];
                          handleUpdateSection(selectedSection.id, {
                            items: [
                              ...items,
                              { label: 'Reliability', value: '99.9%', detail: 'Clustered failover' },
                            ],
                          });
                        }}
                        className="text-[11px] text-[#35123F] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Metric</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {(selectedSection.items || []).map((item: any, itemIdx: number) => (
                        <div
                          key={itemIdx}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-600 text-[10px]">
                              Stat #{itemIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const items = [...(selectedSection.items || [])];
                                items.splice(itemIdx, 1);
                                handleUpdateSection(selectedSection.id, { items });
                              }}
                              className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              value={item.label || ''}
                              onChange={(e) => {
                                const items = [...(selectedSection.items || [])];
                                items[itemIdx] = { ...items[itemIdx], label: e.target.value };
                                handleUpdateSection(selectedSection.id, { items });
                              }}
                              placeholder="Label (e.g. Uptime)"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              value={item.value || ''}
                              onChange={(e) => {
                                const items = [...(selectedSection.items || [])];
                                items[itemIdx] = { ...items[itemIdx], value: e.target.value };
                                handleUpdateSection(selectedSection.id, { items });
                              }}
                              placeholder="Value (e.g. 99.99%)"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-[#35123F]"
                            />
                          </div>
                          <input
                            type="text"
                            value={item.detail || ''}
                            onChange={(e) => {
                              const items = [...(selectedSection.items || [])];
                              items[itemIdx] = { ...items[itemIdx], detail: e.target.value };
                              handleUpdateSection(selectedSection.id, { items });
                            }}
                            placeholder="Detail (e.g. High-availability)"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Specific */}
                {selectedSection.type === 'cta' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={selectedSection.ctaText || ''}
                        onChange={(e) =>
                          handleUpdateSection(selectedSection.id, { ctaText: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        CTA Target URL
                      </label>
                      <input
                        type="text"
                        value={selectedSection.ctaUrl || ''}
                        onChange={(e) =>
                          handleUpdateSection(selectedSection.id, { ctaUrl: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Rich Text Specific */}
                {selectedSection.type === 'rich_text' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      HTML Content
                    </label>
                    <textarea
                      rows={6}
                      value={selectedSection.content || ''}
                      onChange={(e) =>
                        handleUpdateSection(selectedSection.id, { content: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                )}

                {/* 5. Animation & Motion Targeting Card */}
                <div className="space-y-3 p-3 bg-gradient-to-br from-slate-50 to-amber-50/20 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#35123F]" />
                      Animation & Motion Targeting
                    </span>
                    <Link
                      to="/admin/animations"
                      className="text-[11px] font-semibold text-[#35123F] hover:underline flex items-center gap-0.5"
                      title="Open full Animation Studio"
                    >
                      <span>Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Stable Section ID indicator */}
                  <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Target Section ID:</span>
                    <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {selectedSection.id}
                    </code>
                  </div>

                  {/* Assigned Studio Animation */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Assigned Studio Animation
                    </label>
                    <select
                      value={selectedSection.animationId || ''}
                      onChange={(e) =>
                        handleUpdateSection(selectedSection.id, {
                          animationId: e.target.value || undefined,
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#35123F] outline-none"
                    >
                      <option value="">None (Use Preset / Default)</option>
                      {(editorSettings?.animation?.animations || []).map((anim) => (
                        <option key={anim.id} value={anim.id}>
                          {anim.name} ({anim.type} · {anim.trigger}) {!anim.enabled ? '— Disabled' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Active Studio Animation Details */}
                  {selectedSection.animationId && (() => {
                    const matchedAnim = (editorSettings?.animation?.animations || []).find(
                      (a) => a.id === selectedSection.animationId
                    );
                    if (!matchedAnim) {
                      return (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800 flex items-center justify-between">
                          <span>Animation ID missing or removed from studio.</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateSection(selectedSection.id, { animationId: undefined })}
                            className="font-bold underline text-amber-900 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div className="p-2.5 bg-white border border-[#35123F]/20 rounded-lg space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{matchedAnim.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              matchedAnim.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {matchedAnim.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[10px] space-y-0.5">
                          <p>
                            <strong>Trigger:</strong> {matchedAnim.trigger} (scroll threshold:{' '}
                            {matchedAnim.scrollThreshold ?? 15}%)
                          </p>
                          <p>
                            <strong>Timing:</strong> {matchedAnim.duration}ms duration · {matchedAnim.delay}ms delay ·{' '}
                            {matchedAnim.easing}
                          </p>
                        </div>
                        <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                          <Link
                            to="/admin/animations"
                            className="text-[#35123F] hover:underline font-semibold text-[10px]"
                          >
                            Edit in Studio →
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleUpdateSection(selectedSection.id, { animationId: undefined })}
                            className="text-rose-600 hover:underline font-semibold text-[10px] cursor-pointer"
                          >
                            Detach Animation
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Fallback / Quick Preset Selection */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quick Motion Preset
                    </label>
                    <select
                      value={selectedSection.animationPreset || ''}
                      onChange={(e) =>
                        handleUpdateSection(selectedSection.id, {
                          animationPreset: e.target.value || undefined,
                        })
                      }
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-[#35123F] outline-none"
                    >
                      <option value="">None / Natural flow</option>
                      <option value="fade-up">Fade Up (Clean smooth scroll entrance)</option>
                      <option value="fade-in">Fade In (Subtle opacity transition)</option>
                      <option value="slide-in">Slide In (Dynamic lateral entrance)</option>
                      <option value="zoom-in">Zoom & Scale (Contemporary punchy entrance)</option>
                      <option value="rotate-in">Rotate & Reveal (Gentle angular entrance)</option>
                      <option value="hero-dramatic">Hero Dramatic (Immersive blur-to-focus)</option>
                      <option value="stagger-cards">Stagger Child Cards (Sequential cascade)</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-slate-600">Glossy / Glass Mode</label>
                      <Link to="/admin/animations" className="text-[10px] font-semibold text-[#35123F] hover:underline">Configure in Studio</Link>
                    </div>
                    <select
                      value={selectedSection.glossyMode || (selectedSection.glossyEffectId ? 'preset' : 'none')}
                      onChange={(e) => {
                        const mode = e.target.value as 'none' | 'preset' | 'custom';
                        handleUpdateSection(selectedSection.id, {
                          glossyMode: mode,
                          glossyEffectPreset: mode === 'custom' ? selectedSection.glossyEffectPreset || 'glass-surface' : undefined,
                          glossyEffectId: mode === 'preset' ? selectedSection.glossyEffectId : undefined,
                        });
                      }}
                      className="mb-2 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#A855F7]"
                    >
                      <option value="none">None</option><option value="preset">Preset</option><option value="custom">Custom</option>
                    </select>
                    <select
                      value={selectedSection.glossyEffectId || ''}
                      disabled={(selectedSection.glossyMode || (selectedSection.glossyEffectId ? 'preset' : 'none')) !== 'preset'}
                      onChange={(e) => handleUpdateSection(selectedSection.id, { glossyEffectId: e.target.value || undefined, glossyMode: e.target.value ? 'preset' : 'none' })}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-[#A855F7]"
                    >
                      <option value="">Select a saved effect</option>
                      {(editorSettings?.animation?.glossyEffects || []).map((effect) => (
                        <option key={effect.id} value={effect.id}>{effect.name}{effect.enabled ? '' : ' — Disabled'}</option>
                      ))}
                    </select>
                    {selectedSection.glossyMode === 'custom' && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <label className="text-[10px] font-medium text-slate-600">Opacity {selectedSection.glossyEffectOverrides?.opacity ?? 24}%
                          <input type="range" min="0" max="100" value={selectedSection.glossyEffectOverrides?.opacity ?? 24} onChange={(e) => handleUpdateSection(selectedSection.id, { glossyEffectOverrides: { ...selectedSection.glossyEffectOverrides, opacity: Number(e.target.value) } })} className="w-full accent-[#A855F7]" />
                        </label>
                        <label className="text-[10px] font-medium text-slate-600">Blur {selectedSection.glossyEffectOverrides?.blur ?? 12}px
                          <input type="range" min="0" max="28" value={selectedSection.glossyEffectOverrides?.blur ?? 12} onChange={(e) => handleUpdateSection(selectedSection.id, { glossyEffectOverrides: { ...selectedSection.glossyEffectOverrides, blur: Number(e.target.value) } })} className="w-full accent-[#A855F7]" />
                        </label>
                      </div>
                    )}
                    <p className="mt-1 text-[10px] text-slate-500">Glossy effects remain separate from motion and inherit the selected section’s saved configuration.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                Select any section on the outline or preview to configure its properties.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Media Picker Modal */}
      {selectedSection && (
        <MediaPickerModal
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          filter="all"
          onSelect={(item) => {
            if (mediaPickerTarget === 'hero') {
              handleUpdateSection(
                selectedSection.id,
                item.mediaType === 'video'
                  ? { videoUrl: item.url, imageUrl: '' }
                  : { imageUrl: item.url, videoUrl: '' }
              );
            } else {
              handleUpdateSection(
                selectedSection.id,
                item.mediaType === 'video'
                  ? { bannerVideoUrl: item.url, bannerImageUrl: '' }
                  : { bannerImageUrl: item.url, bannerVideoUrl: '' }
              );
            }
            setShowMediaPicker(false);
          }}
        />
      )}

      {/* SEO & Meta Settings Modal */}
      {showSeoModal && page && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#35123F]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Page SEO & Metadata: /{page.slug}
                </h3>
              </div>
              <button
                onClick={() => setShowSeoModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Page Title (Browser Tab)</label>
                <input
                  type="text"
                  value={page.title || ''}
                  onChange={(e) => {
                    setPage({ ...page, title: e.target.value });
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#35123F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={page.metaDescription || ''}
                  onChange={(e) => {
                    setPage({ ...page, metaDescription: e.target.value });
                    setIsDirty(true);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#35123F] resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowSeoModal(false)}
                className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Page Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#35123F]" />
                <h3 className="text-sm font-bold text-slate-900">Create New CMS Page</h3>
              </div>
              <button
                onClick={() => setShowNewPageModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Page Title</label>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="e.g. Careers & Culture"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#35123F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  URL Route / Slug (e.g. careers)
                </label>
                <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                  <span className="px-3 py-2 text-slate-500 font-mono text-xs border-r border-slate-200">
                    /
                  </span>
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    placeholder="careers"
                    className="w-full px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-[#35123F] font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowNewPageModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Initialize Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
