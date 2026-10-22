import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ArrowRight, ShieldCheck, Layers, ExternalLink } from 'lucide-react';
import type { ProductRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { OptionalChatbot } from '../components/public/OptionalChatbot';
import { CursorFollower } from '../components/public/CursorFollower';
import { ProductStageBadge } from '../components/public/ProductStageBadge';
import { useTheme } from '../context/ThemeContext';

import { sanitizeClientHtml } from '../utils/sanitize';
import { brandDocumentTitle } from '../utils/branding';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const { activeSettings, previewDraft } = useTheme();
  const overlayHeader = activeSettings?.header?.isTransparentOnHero ?? false;
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const draftParam = previewDraft && token ? '?draft=true' : '';
        const res = await fetch(`/api/products/${encodeURIComponent(slug)}${draftParam}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          document.title = brandDocumentTitle(data.metaTitle || data.name, activeSettings.header.brandName);
        } else {
          setError('Product not found or currently in private staging.');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading product');
      } finally {
        setLoading(false);
      }
    }

    if (slug) loadProduct();
  }, [slug, token, previewDraft, activeSettings.header.brandName]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] transition-colors duration-200">
        <Header />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Loading Platform Specifications...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] transition-colors duration-200">
        <Header />
        <div className="flex-1 max-w-3xl mx-auto px-6 py-24 text-center space-y-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#35123F]">
            Platform Catalog
          </span>
          <h1 className="text-3xl font-bold text-[#171B2C]">Platform Not Found</h1>
          <p className="text-sm text-[#64748B] max-w-md mx-auto">
            {error || 'The requested solution is not published or has been moved.'}
          </p>
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#35123F] text-white text-xs font-bold uppercase tracking-wider rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Enterprise Platforms</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] selection:bg-[#35123F]/15 selection:text-[#35123F] transition-colors duration-200">
      <CursorFollower />
      <Header />

      <main className="flex-1">
        {/* Breadcrumb / Kicker */}
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 pb-4 ${
            overlayHeader ? 'pt-28 sm:pt-32' : 'pt-10'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <Link to="/" className="hover:text-[#35123F] transition-colors">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/products" className="hover:text-[#35123F] transition-colors">
              Platforms
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#171B2C] font-medium break-words">{product.name}</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-8 sm:py-12 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <ProductStageBadge stage={product.stage} />
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#171B2C] leading-tight">
                  {product.name}
                </h1>
                <p className="text-lg text-[#334155] leading-relaxed max-w-xl font-normal">
                  {product.summary}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                  <Link
                    to="/contact"
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#35123F] text-white text-xs font-bold uppercase tracking-wider rounded transition-all hover:bg-[#24102D] shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{product.ctaLabel || 'Schedule Technical Consultation'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#features"
                    className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:border-[#171B2C] text-[#171B2C] text-xs font-semibold uppercase tracking-wider rounded transition-colors text-center"
                  >
                    Examine Specifications
                  </a>
                </div>
              </div>

              {/* Product Hero Image */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white">
                  <img
                    src={product.heroImage}
                    alt={product.heroImageAlt || product.name}
                    className="w-full h-[260px] sm:h-[360px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Overview and Architecture Description */}
        <section className="py-12 sm:py-16 bg-white border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-8 space-y-6">
                <h2 className="text-2xl font-bold tracking-tight text-[#171B2C]">
                  Platform Architecture & Operations
                </h2>
                <div
                  className="prose prose-slate max-w-none text-sm text-[#334155] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(product.description || '') }}
                />

                {/* Benefits / Outcomes */}
                {product.benefits && product.benefits.length > 0 && (
                  <div className="pt-8 space-y-4">
                    <h3 className="text-lg font-bold text-[#171B2C]">
                      Quantifiable Business Outcomes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {product.benefits.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl bg-[#FAF7F2] border border-slate-200/80 flex items-start gap-3"
                        >
                          <ShieldCheck className="w-5 h-5 text-[#35123F] shrink-0 mt-0.5" />
                          <p className="text-xs text-[#334155] font-medium leading-relaxed">{b}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar: Use Cases & Target Environments */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-5 sm:p-6 bg-[#FAF7F2] rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#35123F]">
                    Primary Operating Environments
                  </h3>
                  <ul className="space-y-2.5">
                    {product.useCases.map((uc, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D5A13C] shrink-0 mt-1.5" />
                        <span className="min-w-0 break-words">{uc}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-[11px] text-[#64748B]">
                      Fully sovereign deployment available via Docker, Kubernetes, or hosted Neon DB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Checklist */}
        <section id="features" className="py-12 sm:py-16 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 space-y-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#35123F]">
                Platform Modules
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#171B2C]">
                Core Enterprise Capabilities
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {product.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#35123F]/10 flex items-center justify-center text-[#35123F]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[#171B2C]">{feat}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Production-grade implementation with automated telemetry, audit logging, and API access.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to Deploy Section */}
        <section className="py-12 sm:py-16 bg-[#FAF7F2] border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#171B2C]">
              Ready to Evaluate {product.name}?
            </h2>
            <p className="text-sm text-[#334155] max-w-xl mx-auto leading-relaxed">
              Schedule a personalized walkthrough with our systems architects. We provide full deployment roadmaps, sandbox instances, and pricing tiers.
            </p>
            <div className="pt-2 flex justify-center">
              <Link
                to="/contact"
                className="w-full sm:w-auto px-6 py-3.5 bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Initiate Technical Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <OptionalChatbot />
    </div>
  );
};
