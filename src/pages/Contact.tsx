import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, ShieldCheck, ArrowRight, Building2 } from 'lucide-react';
import { Header } from '../components/public/Header';
import { Footer } from '../components/public/Footer';
import { ContactForm } from '../components/public/ContactForm';
import { OptionalChatbot } from '../components/public/OptionalChatbot';
import { CursorFollower } from '../components/public/CursorFollower';
import { useTheme } from '../context/ThemeContext';

export const Contact: React.FC = () => {
  const { activeSettings } = useTheme();

  useEffect(() => {
    const brand = activeSettings?.header?.brandName || 'Enterprise Platform';
    document.title = `Contact Technical Advisory | ${brand}`;
    window.scrollTo(0, 0);
  }, [activeSettings]);

  const cfg = activeSettings?.footer;
  const overlayHeader = activeSettings?.header?.isTransparentOnHero ?? false;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg,#FAF7F2)] text-[var(--color-body,#334155)] selection:bg-[#35123F]/15 selection:text-[#35123F] transition-colors duration-200">
      <CursorFollower />
      <Header />

      <main className="flex-1">
        {/* Contact Page Hero */}
        <section
          className={`${
            overlayHeader
              ? 'pt-28 pb-10 sm:pt-32 sm:pb-14 md:pt-32 md:pb-20'
              : 'py-10 sm:py-14 md:py-20'
          } border-b border-slate-200/80 bg-white`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#35123F]">
                <Link to="/" className="hover:underline">
                  Home
                </Link>
                <span aria-hidden="true">/</span>
                <span>Contact & Technical Discovery</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#171B2C]">
                Connect With {activeSettings?.header?.brandName || 'Our'} Solutions Architects
              </h1>
              <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                Whether you need dedicated enterprise deployment, high-concurrency database architecture,
                or custom integration middleware, {activeSettings?.header?.brandName || 'our'} senior engineers provide direct consultation and SLA estimates.
              </p>

              {/* Direct Metrics / SLA Trust Badges */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-slate-200">
                  <div className="flex items-center gap-2 text-[#35123F] mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Fast Turnaround</span>
                  </div>
                  <p className="text-xs text-slate-600">Guaranteed response within 1 business day</p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-slate-200">
                  <div className="flex items-center gap-2 text-[#35123F] mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Security First</span>
                  </div>
                  <p className="text-xs text-slate-600">Encrypted transmission & NDA alignment</p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-slate-200">
                  <div className="flex items-center gap-2 text-[#35123F] mb-1">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Direct Access</span>
                  </div>
                  <p className="text-xs text-slate-600">Direct consult with solutions engineers</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Embedded Interactive Contact & Advisory Form */}
        <ContactForm />
      </main>

      <Footer />
      <OptionalChatbot />
    </div>
  );
};
