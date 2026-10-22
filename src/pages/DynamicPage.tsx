import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { SectionRenderer } from '../components/public/SectionRenderer';
import { ContactForm } from '../components/public/ContactForm';
import { OptionalChatbot } from '../components/public/OptionalChatbot';
import { CursorFollower } from '../components/public/CursorFollower';
import type { PageRecord, ProductRecord } from '../types';
import { ArrowLeft, Layers, ShieldAlert } from 'lucide-react';
import { brandDocumentTitle } from '../utils/branding';

export const DynamicPage: React.FC = () => {
  const params = useParams();
  const slug = params.slug ?? params['*'] ?? '';
  const { previewDraft, activeSettings } = useTheme();
  const { token } = useAuth();

  const [page, setPage] = useState<PageRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Guard reserved routes
  if (slug === 'home' || !slug) {
    return <Navigate to="/" replace />;
  }
  if (slug === 'admin' || slug.startsWith('admin')) {
    return <Navigate to="/admin" replace />;
  }
  if (slug === 'product' || slug === 'products') {
    return <Navigate to="/product" replace />;
  }

  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      setLoading(true);
      setNotFound(false);
      if (slug.includes('/')) {
        setNotFound(true);
        setLoading(false);
        document.title = brandDocumentTitle('Page Not Found', activeSettings.header.brandName);
        return;
      }

      try {
        const headers: Record<string, string> = {};
        // Only use draft preview for authenticated admin users
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch draft only if preview mode is active AND user is authenticated
        const draftParam = (previewDraft && token) ? '?draft=true' : '';
        const pageRes = await fetch(`/api/pages/${slug}${draftParam}`, { headers });

        if (!isCurrent) return;

        if (pageRes.ok) {
          const pageData = await pageRes.json();
          setPage(pageData);
          if (pageData.title) {
            document.title = brandDocumentTitle(pageData.title, activeSettings.header.brandName);
          }
        } else {
          setNotFound(true);
          document.title = brandDocumentTitle('Page Not Found', activeSettings.header.brandName);
        }

        // Fetch products for product showcase sections
        const prodRes = await fetch('/api/products', { headers });
        if (prodRes.ok && isCurrent) {
          const prods = await prodRes.json();
          setProducts(prods);
        }
      } catch (err) {
        if (isCurrent) {
          console.warn(`Failed loading dynamic page ${slug}:`, err);
          setNotFound(true);
          document.title = brandDocumentTitle('Page Not Found', activeSettings.header.brandName);
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [slug, previewDraft, token, activeSettings.header.brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] selection:bg-[#35123F]/15 selection:text-[#35123F] transition-colors duration-200">
      <CursorFollower />
      <Header sections={page?.sections} />

      <main className="flex-1">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-3">
              Initializing Enterprise View...
            </p>
          </div>
        ) : notFound ? (
          <div className="max-w-3xl mx-auto px-6 py-28 text-center space-y-6">
            <div className="w-16 h-16 bg-[#35123F]/10 text-[#35123F] rounded-2xl flex items-center justify-center mx-auto ring-8 ring-[#35123F]/5">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#35123F]">
                404 · Navigation Route Not Found
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#171B2C] mt-2">
                Page Not Found
              </h1>
              <p className="text-sm text-slate-600 max-w-md mx-auto mt-3">
                The requested page <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">/{slug}</code> is either not published yet or under active configuration in the Page Builder CMS.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#35123F] text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-[#24102D] transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Homepage</span>
              </Link>
              <Link
                to="/product"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-[#35123F]" />
                <span>Explore Products</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {page?.sections?.map((sec) => (
              <SectionRenderer key={sec.id} section={sec} products={products} />
            ))}
            <ContactForm />
          </>
        )}
      </main>

      <Footer />
      <OptionalChatbot />
    </div>
  );
};
