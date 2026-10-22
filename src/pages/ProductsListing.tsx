import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Search,
  Layers,
  Info,
  ArrowRight,
} from 'lucide-react';
import type { ProductRecord } from '../types';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { OptionalChatbot } from '../components/public/OptionalChatbot';
import { CursorFollower } from '../components/public/CursorFollower';
import { ProductStageBadge } from '../components/public/ProductStageBadge';
import { ProductDetailModal } from '../components/public/ProductDetailModal';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { brandDocumentTitle } from '../utils/branding';

export const ProductsListing: React.FC = () => {
  const { activeSettings, previewDraft } = useTheme();
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);

  useEffect(() => {
    document.title = brandDocumentTitle('Enterprise Platforms', activeSettings.header.brandName);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const endpoint = previewDraft && token ? '/api/products/all' : '/api/products';
    fetch(endpoint, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Could not load products');
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch((error) => console.warn('Failed loading products:', error))
      .finally(() => setLoading(false));
  }, [activeSettings.header.brandName, previewDraft, token]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.summary.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.features.some((f) => f.toLowerCase().includes(search.toLowerCase())) ||
      p.useCases.some((u) => u.toLowerCase().includes(search.toLowerCase()))
  );

  const overlayHeader = activeSettings?.header?.isTransparentOnHero ?? false;
  const gridCols = activeSettings?.productGrid?.columns ?? 2;
  const gridColsClass =
    gridCols === 1
      ? 'grid-cols-1 max-w-3xl mx-auto'
      : gridCols === 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : gridCols === 4
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] selection:bg-[#35123F]/15 selection:text-[#35123F] transition-colors duration-200">
      <CursorFollower />
      <Header />

      <main className="flex-1">
        {/* Header Hero */}
        <section
          className={`${
            overlayHeader ? 'pt-28 pb-14 md:pt-32 md:pb-18' : 'py-14 md:py-18'
          } border-b border-slate-200/80 bg-white`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#35123F]">
                <Link to="/" className="hover:underline">
                  Home
                </Link>
                <span aria-hidden="true">/</span>
                <span>Enterprise Platforms Catalog</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#171B2C]">
                Flagship Enterprise Platforms
              </h1>
              <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                Discover our customizable software suites. Click <strong>“See Full Details”</strong> on
                any platform below to open the complete operational architecture, feature modules,
                and business outcomes in an interactive pop-up card.
              </p>

              {/* Search filter */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search capabilities, modules, or platform keywords..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-xs text-[#171B2C] bg-[#FAF7F2] focus:outline-none focus:ring-2 focus:ring-[#35123F]/20 focus:border-[#35123F]"
                  />
                </div>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Product Cards Grid: 2x2 by default on desktop, responsive for tablet & mobile */}
        <section className="py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-3">
                  Loading Platform Directory...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
                <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#171B2C]">No matching platforms</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search keywords or clear the filter.
                </p>
              </div>
            ) : (
              <div className={`grid ${gridColsClass} gap-5 sm:gap-6 md:gap-8`}>
                {filtered.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200 transition-all duration-300 overflow-hidden shadow-xs hover:shadow-lg flex flex-col justify-between group hover:border-[#35123F]/40"
                  >
                    <div>
                      {/* Product Hero Image with Stage Badge */}
                      <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                        {prod.heroImage ? (
                          <img
                            src={prod.heroImage}
                            alt={prod.heroImageAlt || prod.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#171B2C] flex items-center justify-center text-white">
                            <Layers className="w-12 h-12 text-[#D5A13C]" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <ProductStageBadge stage={prod.stage} />
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6 md:p-7 space-y-4">
                        <div className="space-y-1">
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171B2C] group-hover:text-[#35123F] transition-colors">
                            {prod.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-[#334155] leading-relaxed line-clamp-3">
                            {prod.summary}
                          </p>
                        </div>

                        {/* Top Features */}
                        <div className="pt-2 space-y-1.5">
                          {prod.features.slice(0, 3).map((f, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-[#64748B]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#D5A13C] shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: See Full Details triggers the pop-up modal */}
                    <div className="p-5 sm:p-6 md:p-7 pt-0 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(prod)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-2xs hover:shadow"
                      >
                        <Info className="w-4 h-4 text-[#D5A13C]" />
                        <span>See Full Details</span>
                      </button>

                      <Link
                        to="/contact"
                        className="w-full sm:w-auto text-center px-4 py-2 bg-[#FAF7F2] hover:bg-slate-100 text-[#171B2C] text-xs font-semibold uppercase tracking-wider rounded-lg border border-slate-200 transition-colors"
                      >
                        Request Demo
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <OptionalChatbot />

      {/* Pop-up Card / Modal for Full Details on the Same Page */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
