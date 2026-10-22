import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { SectionRenderer } from '../components/public/SectionRenderer';
import { ContactForm } from '../components/public/ContactForm';
import { OptionalChatbot } from '../components/public/OptionalChatbot';
import { CursorFollower } from '../components/public/CursorFollower';
import type { PageRecord, ProductRecord } from '../types';
import { brandDocumentTitle } from '../utils/branding';

// Default fallback homepage content for public site
const DEFAULT_HOMEPAGE: PageRecord = {
  id: 'page-home',
  slug: 'home',
  title: 'Enterprise Technology Architecture',
  metaDescription: 'Mission-critical digital systems, scalable software platforms, and enterprise solutions.',
  isPublished: true,
  publishedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: 'sec-hero',
      type: 'hero',
      title: 'Architecting Enterprise Digital Foundations',
      subtitle: 'Engineers high-performance software platforms, robust infrastructure, and intelligent business ecosystems for ambitious global organizations.',
      content: 'From high-throughput commerce engines and biometric gym operations to clinical healthcare suites and enterprise learning platforms, we turn complex technical friction into enduring competitive velocity.',
      alignment: 'left',
      bgTreatment: 'default',
      imageUrl: '/src/assets/images/hero_tech_enterprise_1792419734209.jpg',
      imageAlt: 'Enterprise innovation architecture',
      ctaText: 'Explore Solutions',
      ctaUrl: '#products',
    },
    {
      id: 'sec-stats',
      type: 'statistics',
      title: 'Engineered for Performance & Scale',
      subtitle: 'Quantifiable operational outcomes delivered across our enterprise platforms.',
      bgTreatment: 'surface',
      items: [
        { label: 'Uptime Reliability', value: '99.99%', detail: 'High-availability clustered deployment' },
        { label: 'Transactions Processed', value: '45M+', detail: 'Annual secure financial events' },
        { label: 'Operational Reduction', value: '38%', detail: 'Average administrative overhead saved' },
        { label: 'Latency Baseline', value: '<85ms', detail: 'Global edge-cached response' },
      ],
    },
    {
      id: 'sec-product-showcase',
      type: 'product_showcase',
      title: 'Flagship Enterprise Platforms',
      subtitle: 'Discover our four core operational suites, each customizable and ready for on-premise or cloud deployment.',
      bgTreatment: 'default',
    },
  ],
};

export const Home: React.FC = () => {
  const { previewDraft, activeSettings } = useTheme();
  const { token } = useAuth();
  const [page, setPage] = useState<PageRecord | null>(null);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      try {
        const headers: Record<string, string> = {};
        // Only use draft preview for authenticated admin users
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Fetch homepage page record (draft if preview mode active AND user is authenticated)
        const draftParam = (previewDraft && token) ? '?draft=true' : '';
        const pageRes = await fetch(`/api/pages/home${draftParam}`, { headers });
        if (pageRes.ok) {
          const pageData = await pageRes.json();
          setPage(pageData);
          if (pageData.title) {
            document.title = brandDocumentTitle(pageData.title, activeSettings.header.brandName);
          }
        } else {
          // Fallback to default homepage if API fails
          setPage(DEFAULT_HOMEPAGE);
          document.title = brandDocumentTitle(DEFAULT_HOMEPAGE.title, activeSettings.header.brandName);
        }

        // Fetch products
        const prodRes = await fetch('/api/products', { headers });
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods);
        }
      } catch (err) {
        console.warn('Failed loading homepage content, using default:', err);
        // Fallback to default homepage on error
        setPage(DEFAULT_HOMEPAGE);
        document.title = brandDocumentTitle(DEFAULT_HOMEPAGE.title, activeSettings.header.brandName);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [previewDraft, token, activeSettings.header.brandName]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] selection:bg-[#35123F]/15 selection:text-[#35123F] transition-colors duration-200">
      <CursorFollower />
      <Header sections={page?.sections} />

      <main className="flex-1">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mt-3">
              Initializing Systems...
            </p>
          </div>
        ) : (
          page?.sections?.map((sec) => (
            <SectionRenderer key={sec.id} section={sec} products={products} />
          ))
        )}

        <ContactForm />
      </main>

      <Footer />
      <OptionalChatbot />
    </div>
  );
};
