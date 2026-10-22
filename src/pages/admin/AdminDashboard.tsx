import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Box,
  Inbox,
  Image,
  Navigation,
  Palette,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  Server,
  Clock,
  ShieldCheck,
  RefreshCw,
  Mail,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface DashboardStats {
  productsCount: number;
  publishedProducts: number;
  pagesCount: number;
  leadsCount: number;
  newLeadsCount: number;
  enquiriesCount: number;
  newEnquiriesCount: number;
  mediaCount: number;
  dbType: string;
  dbConnected: boolean;
  smtpConfigured: boolean;
}

interface RecentActivityItem {
  id: string;
  type: 'lead' | 'enquiry';
  name: string;
  email: string;
  date: string;
  status: string;
  preview: string;
}

export const AdminDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { editorSettings, publishSettings, isSaving, cmsMode } = useTheme();
  const isLight = cmsMode === 'light';

  const [stats, setStats] = useState<DashboardStats>({
    productsCount: 0,
    publishedProducts: 0,
    pagesCount: 0,
    leadsCount: 0,
    newLeadsCount: 0,
    enquiriesCount: 0,
    newEnquiriesCount: 0,
    mediaCount: 0,
    dbType: 'Loading...',
    dbConnected: true,
    smtpConfigured: false,
  });

  const [recentItems, setRecentItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};

      const [healthRes, productsRes, pagesRes, leadsRes, enquiriesRes] = await Promise.allSettled([
        fetch('/api/admin/health', { headers }),
        fetch('/api/products/all', { headers }),
        fetch('/api/pages', { headers }),
        fetch('/api/leads', { headers }),
        fetch('/api/enquiries', { headers }),
      ]);

      let dbType = 'Local / Fallback';
      let dbConnected = true;
      let mediaCount = 0;
      let smtpConfigured = false;

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const healthData = await healthRes.value.json();
        dbType = healthData.database?.type || 'Local Memory';
        dbConnected = healthData.database?.connected ?? true;
        mediaCount = healthData.database?.mediaCount || 0;
        smtpConfigured = !!healthData.smtpConfigured;
      }

      let productsCount = 0;
      let publishedProducts = 0;
      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const productsData = await productsRes.value.json();
        if (Array.isArray(productsData)) {
          productsCount = productsData.length;
          publishedProducts = productsData.filter((p: any) => p.published).length;
        }
      }

      let pagesCount = 0;
      if (pagesRes.status === 'fulfilled' && pagesRes.value.ok) {
        const pagesData = await pagesRes.value.json();
        if (Array.isArray(pagesData)) {
          pagesCount = pagesData.length;
        }
      }

      let leadsCount = 0;
      let newLeadsCount = 0;
      const combinedRecent: RecentActivityItem[] = [];

      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const leadsData = await leadsRes.value.json();
        if (Array.isArray(leadsData)) {
          leadsCount = leadsData.length;
          newLeadsCount = leadsData.filter((l: any) => l.status === 'new').length;
          leadsData.slice(0, 4).forEach((l: any) => {
            combinedRecent.push({
              id: l.id,
              type: 'lead',
              name: l.name || 'Anonymous',
              email: l.email || '',
              date: l.createdAt || new Date().toISOString(),
              status: l.status || 'new',
              preview: l.requirements || l.company || 'Enterprise solution inquiry',
            });
          });
        }
      }

      let enquiriesCount = 0;
      let newEnquiriesCount = 0;
      if (enquiriesRes.status === 'fulfilled' && enquiriesRes.value.ok) {
        const enquiriesData = await enquiriesRes.value.json();
        if (Array.isArray(enquiriesData)) {
          enquiriesCount = enquiriesData.length;
          newEnquiriesCount = enquiriesData.filter((e: any) => e.status === 'new').length;
          enquiriesData.slice(0, 4).forEach((e: any) => {
            combinedRecent.push({
              id: e.id,
              type: 'enquiry',
              name: e.name || 'Visitor',
              email: e.email || '',
              date: e.createdAt || new Date().toISOString(),
              status: e.status || 'new',
              preview: e.subject || e.message || 'General contact enquiry',
            });
          });
        }
      }

      // Sort recent items by date descending
      combinedRecent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentItems(combinedRecent.slice(0, 6));

      setStats({
        productsCount,
        publishedProducts,
        pagesCount,
        leadsCount,
        newLeadsCount,
        enquiriesCount,
        newEnquiriesCount,
        mediaCount,
        dbType,
        dbConnected,
        smtpConfigured,
      });
    } catch (err) {
      console.warn('[AdminDashboard] Telemetry fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickPublish = async () => {
    setPublishSuccess(false);
    const ok = await publishSettings();
    if (ok) {
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4000);
    }
  };

  const brandTitle = editorSettings?.header?.brandName || 'Azaroth';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
      {/* Welcome & Command Bar */}
      <div className={`p-4 sm:p-6 rounded-2xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131624] border-slate-800 text-slate-100'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational CMS
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Role: <strong className="capitalize text-slate-700 dark:text-slate-200">{user?.role || 'Administrator'}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {brandTitle} Management Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Welcome back, {user?.name || 'Administrator'}. Monitor content performance, manage pages, and publish live updates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            onClick={fetchDashboardData}
            title="Refresh statistics"
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              isLight
                ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
              isLight
                ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </Link>

          <button
            onClick={handleQuickPublish}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all disabled:opacity-50"
          >
            {publishSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Published to Live!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#D5A13C]" />
                <span>{isSaving ? 'Publishing...' : 'Publish Draft'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products KPI */}
        <Link
          to="/admin/products"
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] shadow-xs block ${
            isLight
              ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              : 'bg-[#131624] border-slate-800 hover:border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Products</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.productsCount}
            </span>
            <span className="text-xs text-slate-500">
              ({stats.publishedProducts} active)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>Manage product catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
          </div>
        </Link>

        {/* Dynamic Pages KPI */}
        <Link
          to="/admin/pages"
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] shadow-xs block ${
            isLight
              ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              : 'bg-[#131624] border-slate-800 hover:border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Custom Pages</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.pagesCount}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Structured layouts
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>Launch visual page builder</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-500" />
          </div>
        </Link>

        {/* Leads & Inquiries KPI */}
        <Link
          to="/admin/inbox"
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] shadow-xs block ${
            isLight
              ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              : 'bg-[#131624] border-slate-800 hover:border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Leads & Inquiries</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats.leadsCount + stats.enquiriesCount}
            </span>
            {(stats.newLeadsCount + stats.newEnquiriesCount > 0) && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {stats.newLeadsCount + stats.newEnquiriesCount} New
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>Open unified inbox</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </Link>

        {/* Media & System Health */}
        <Link
          to="/admin/deployment"
          className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] shadow-xs block ${
            isLight
              ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              : 'bg-[#131624] border-slate-800 hover:border-slate-700 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">System & Database</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white capitalize">
              {stats.dbType}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              stats.dbConnected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600'
            }`}>
              {stats.dbConnected ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
            <span>Media: {stats.mediaCount} assets</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Quick Action Hub & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Action Hub (2 Columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Studio Quick Actions
            </h2>
            <span className="text-xs text-slate-500">Fast access to core modules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Link
              to="/admin/pages"
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-[#35123F]/40 text-slate-800'
                  : 'bg-[#131624] border-slate-800 hover:border-[#35123F]/50 text-slate-100'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-[#35123F]/10 text-[#35123F] dark:text-[#E02854] shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Page Builder</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compose dynamic pages, organize sections, customize hero banners, and edit content blocks.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/products"
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-blue-500/40 text-slate-800'
                  : 'bg-[#131624] border-slate-800 hover:border-blue-500/50 text-slate-100'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Product Catalog</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Manage product specifications, stages, pricing flags, feature sets, and hero media.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/branding"
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-[#D5A13C]/40 text-slate-800'
                  : 'bg-[#131624] border-slate-800 hover:border-[#D5A13C]/50 text-slate-100'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-[#D5A13C]/10 text-[#D5A13C] shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Branding & Header</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload company logo, set brand names, configure navigation links, and adjust header styles.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/theme"
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-emerald-500/40 text-slate-800'
                  : 'bg-[#131624] border-slate-800 hover:border-emerald-500/50 text-slate-100'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Theme & Palette</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fine-tune primary, secondary, and accent colors across the website and admin dashboard.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/media"
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-indigo-500/40 text-slate-800'
                  : 'bg-[#131624] border-slate-800 hover:border-indigo-500/50 text-slate-100'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Image className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Media Library</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload high-res imagery, SVGs, inspect file sizes, copy asset URLs, and delete old files.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/settings"
              className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all hover:scale-[1.01] ${
                isLight
                  ? 'bg-white border-slate-200 hover:border-slate-400 text-slate-800'
                  : 'bg-[#131624] border-slate-800 hover:border-slate-600 text-slate-100'
              }`}
            >
              <div className="p-2.5 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">CMS Settings Hub</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Configure white-label appearance, sidebar themes, reset defaults, and review system settings.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Inquiries & Leads Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Inbound
            </h2>
            <Link to="/admin/inbox" className="text-xs text-[#35123F] dark:text-[#E02854] hover:underline font-semibold">
              View All
            </Link>
          </div>

          <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
          }`}>
            {recentItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No inbound leads or contact messages logged yet.
              </div>
            ) : (
              recentItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    isLight
                      ? 'border-slate-100 bg-slate-50/70 hover:bg-slate-100'
                      : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      item.status === 'new'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : item.status === 'in_progress'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <Mail className="w-3 h-3 opacity-60" />
                    <span className="truncate">{item.email}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                    {item.preview}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
