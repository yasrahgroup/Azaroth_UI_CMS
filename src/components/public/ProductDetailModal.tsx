import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle2, ShieldCheck, ArrowRight, Layers, ExternalLink } from 'lucide-react';
import type { ProductRecord } from '../../types';
import { ProductStageBadge } from './ProductStageBadge';
import { sanitizeClientHtml } from '../../utils/sanitize';

interface ProductDetailModalProps {
  product: ProductRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  // Close on escape key and lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} Details`}
    >
      <div
        className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 bg-[#171B2C] text-white flex items-center justify-between gap-3 shrink-0 border-b border-[#D5A13C]/20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D5A13C] shrink-0">
              Product Overview
            </span>
            <span className="text-slate-500 shrink-0">•</span>
            <span className="text-xs font-medium text-slate-200 truncate">{product.name}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 shrink-0 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D5A13C]"
            aria-label="Close product details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 sm:space-y-8 flex-1 bg-[#FAF7F2]/40">
          {/* Top Hero Grid: Image and Title */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start">
            <div className="md:col-span-5 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm aspect-4/3">
              {product.heroImage ? (
                <img
                  src={product.heroImage}
                  alt={product.heroImageAlt || product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <Layers className="w-12 h-12 text-[#D5A13C]" />
                </div>
              )}
              <div className="absolute top-3 left-3">
                <ProductStageBadge stage={product.stage} />
              </div>
            </div>

            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171B2C]">
                  {product.name}
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-[#35123F] mt-1">
                  Autonomous Deployment & High-Concurrency Telemetry
                </p>
              </div>

              <p className="text-sm text-[#334155] leading-relaxed">
                {product.summary}
              </p>

              {/* Action buttons inside modal */}
              <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <Link
                  to="/contact"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <span>{product.ctaLabel || 'Schedule Technical Consultation'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Deep Architecture Description */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#35123F]">
              Technical Specifications & Architecture
            </h3>
            <div
              className="text-sm text-[#334155] leading-relaxed space-y-2 prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeClientHtml(product.description || '') }}
            />
          </div>

          {/* Business Outcomes & Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#35123F]">
                Quantifiable Business Outcomes & SLA Impact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {product.benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-start gap-3"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#35123F] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#334155] font-medium leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Checklist */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#35123F]">
                Capability Checklist ({product.features.length} Enterprise Modules)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {product.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs text-[#171B2C]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#D5A13C] shrink-0 mt-0.5" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Use Cases */}
          {product.useCases && product.useCases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#35123F]">
                Target Enterprise Environments
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.useCases.map((uc, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                  >
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-4 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium text-center sm:text-left">
            Stage: <span className="font-semibold text-slate-700">{product.stage || 'Live'}</span> • Enterprise Production Architecture
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
