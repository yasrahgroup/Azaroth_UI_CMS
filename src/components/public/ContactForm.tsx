import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Building, Mail, Phone } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ContactForm: React.FC = () => {
  const { activeSettings } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    productInterest: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const cfg = activeSettings?.footer;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setStatus('idle');
    setFeedbackMsg('');

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setFeedbackMsg(data.message || 'Your inquiry has been submitted successfully.');
        setFormData({
          name: '',
          email: '',
          subject: '',
          productInterest: '',
          message: '',
        });
      } else {
        setStatus('error');
        setFeedbackMsg(data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      setStatus('error');
      setFeedbackMsg('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact" className="py-12 sm:py-20 bg-[#FAF7F2] border-t border-[#E2E8F0]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct Office & Advisory Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#35123F]">
                Direct Technical Advisory
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#171B2C]">
                {activeSettings?.header?.brandName || 'Enterprise'} Architecture Consultation
              </h2>
              <p className="text-sm text-[#334155] leading-relaxed">
                Connect directly with {activeSettings?.header?.brandName || 'our'} senior software engineers and solutions architects.
                Whether you require high-availability deployment, custom database migrations, or
                platform integration, our engineering teams are prepared.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#35123F]/10 flex items-center justify-center shrink-0 text-[#35123F]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Electronic Mail</h4>
                  <a
                    href={`mailto:${cfg?.contactEmail || 'contact@example.com'}`}
                    className="text-sm font-medium text-[#171B2C] hover:text-[#35123F] transition-colors break-all"
                  >
                    {cfg?.contactEmail || 'contact@example.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#35123F]/10 flex items-center justify-center shrink-0 text-[#35123F]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Direct Line</h4>
                  <a
                    href={`tel:${cfg?.contactPhone || '+18005551234'}`}
                    className="text-sm font-medium text-[#171B2C] hover:text-[#35123F] transition-colors"
                  >
                    {cfg?.contactPhone || '+1 (800) 555-1234'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#35123F]/10 flex items-center justify-center shrink-0 text-[#35123F]">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500">Corporate HQ</h4>
                  <p className="text-sm text-[#334155]">
                    {cfg?.address || 'Your Company Address'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-8 md:p-10 rounded-2xl border border-slate-200 shadow-sm">
            {status === 'success' && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Inquiry Dispatched</h4>
                  <p className="text-xs text-emerald-700 mt-1">{feedbackMsg}</p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Submission Issue</h4>
                  <p className="text-xs text-rose-700 mt-1">{feedbackMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name <span className="text-[#35123F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#171B2C] focus:outline-none focus:ring-2 focus:ring-[#35123F]/20 focus:border-[#35123F] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Corporate Email <span className="text-[#35123F]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#171B2C] focus:outline-none focus:ring-2 focus:ring-[#35123F]/20 focus:border-[#35123F] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Platform Interest
                  </label>
                  <select
                    value={formData.productInterest}
                    onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#171B2C] bg-white focus:outline-none focus:ring-2 focus:ring-[#35123F]/20 focus:border-[#35123F] transition-colors"
                  >
                    <option value="">General Enterprise Inquiry</option>
                    <option value="Gym Management">{activeSettings?.header?.brandName || 'Enterprise'} Gym Management</option>
                    <option value="Enterprise Commerce">{activeSettings?.header?.brandName || 'Enterprise'} Commerce</option>
                    <option value="Enterprise LMS">{activeSettings?.header?.brandName || 'Enterprise'} LMS</option>
                    <option value="MediCare Clinical Suite">{activeSettings?.header?.brandName || 'Enterprise'} Clinical Suite</option>
                    <option value="Custom Infrastructure Architecture">Custom Infrastructure Architecture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Subject"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#171B2C] focus:outline-none focus:ring-2 focus:ring-[#35123F]/20 focus:border-[#35123F] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Project Scope & Specifications <span className="text-[#35123F]">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Outline your target volume, existing systems, or desired deployment timeline..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-[#171B2C] focus:outline-none focus:ring-2 focus:ring-[#35123F]/20 focus:border-[#35123F] transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 bg-[#35123F] hover:bg-[#24102D] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Transmitting Inquiry...</span>
                  ) : (
                    <>
                      <span>Transmit Inquiry</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
