import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, CheckCircle, ChevronRight, User, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ProductRecord } from '../../types';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  options?: { label: string; action: string; payload?: any }[];
  isForm?: boolean;
}

export const Chatbot: React.FC = () => {
  const { activeSettings, isPublicDarkActive } = useTheme();
  const isPublicDark = isPublicDarkActive;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadRefId, setLeadRefId] = useState('');

  // Form capture state
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    businessType: 'Enterprise',
    productInterest: '',
    requirements: '',
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch published products for dynamic recommendations
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  const botCfg = activeSettings?.chatbot;
  const botName = botCfg?.botName || 'Solutions Advisor';
  const statusText = botCfg?.statusText || 'Enterprise Assistant';
  const avatarUrl = botCfg?.avatarUrl || '';
  const welcomeMessage =
    botCfg?.welcomeMessage ||
    `Welcome! I can assist you with information about our enterprise software platforms, answer architecture questions, or connect you with a solutions architect. How can I help today?`;
  const triggerLabel = botCfg?.triggerLabel || 'Solutions Advisor';
  const placeholderText = botCfg?.placeholderText || 'Ask a technical or platform question...';

  // Theme synchronization tokens
  const primaryColor = activeSettings?.theme?.primary || '#35123F';
  const accentColor = activeSettings?.theme?.accent || '#D5A13C';
  const gradientStart = activeSettings?.theme?.gradientStart || primaryColor;
  const gradientEnd = activeSettings?.theme?.gradientEnd || accentColor;
  const gradientAngle = activeSettings?.theme?.gradientAngle ?? 135;
  const botGradient = `linear-gradient(${gradientAngle}deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
  const launcherGradient = `linear-gradient(135deg, ${primaryColor} 0%, ${gradientEnd} 100%)`;

  // Custom chatbot colors with seamless theme fallback
  const customColors = botCfg?.colors;
  const useCustomColors = customColors?.useCustomColors ?? false;

  const resolvedWindowBg = useCustomColors && customColors?.windowBg
    ? customColors.windowBg
    : (isPublicDark ? '#131624' : '#FFFFFF');
  const resolvedHeaderBg = useCustomColors && customColors?.headerBg
    ? customColors.headerBg
    : botGradient;
  const resolvedHeaderText = useCustomColors && customColors?.headerText
    ? customColors.headerText
    : '#FFFFFF';
  const resolvedBotBubbleBg = useCustomColors && customColors?.botBubbleBg
    ? customColors.botBubbleBg
    : (isPublicDark ? '#1E2337' : '#FFFFFF');
  const resolvedBotBubbleText = useCustomColors && customColors?.botBubbleText
    ? customColors.botBubbleText
    : (isPublicDark ? '#F8FAFC' : '#171B2C');
  const resolvedUserBubbleBg = useCustomColors && customColors?.userBubbleBg
    ? customColors.userBubbleBg
    : primaryColor;
  const resolvedUserBubbleText = useCustomColors && customColors?.userBubbleText
    ? customColors.userBubbleText
    : '#FFFFFF';
  const resolvedLauncherBg = useCustomColors && customColors
    ? customColors.launcherGradientEnabled && customColors.launcherGradientEnd
      ? `linear-gradient(${customColors.launcherGradientAngle ?? 135}deg, ${customColors.launcherBg || primaryColor} 0%, ${customColors.launcherGradientEnd} 100%)`
      : (customColors.launcherBg || launcherGradient)
    : launcherGradient;
  const resolvedLauncherIcon = useCustomColors && customColors?.launcherIconColor
    ? customColors.launcherIconColor
    : '#FFFFFF';
  const resolvedActionButtonBg = useCustomColors && customColors?.actionButtonBg
    ? customColors.actionButtonBg
    : (isPublicDark ? '#1E2337' : '#FFFFFF');
  const resolvedActionButtonText = useCustomColors && customColors?.actionButtonText
    ? customColors.actionButtonText
    : (isPublicDark ? '#E2E8F0' : '#171B2C');
  const resolvedActionButtonBorder = useCustomColors && customColors?.actionButtonBorder
    ? customColors.actionButtonBorder
    : (isPublicDark ? '#334155' : '#CBD5E1');
  const resolvedSendButtonBg = useCustomColors && customColors?.sendButtonBg
    ? customColors.sendButtonBg
    : primaryColor;
  const resolvedSendButtonText = useCustomColors && customColors?.sendButtonText
    ? customColors.sendButtonText
    : '#FFFFFF';

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'm-init',
          sender: 'bot',
          text: welcomeMessage,
          options: [
            { label: 'Explore Platforms', action: 'explore_products' },
            { label: 'Help Me Choose a Solution', action: 'start_advisor' },
            { label: 'Frequently Asked Questions', action: 'show_faqs' },
            { label: 'Submit Requirements / RFP', action: 'show_rfp_form' },
          ],
        },
      ]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, leadSubmitted]);

  const handleOptionClick = (option: { label: string; action: string; payload?: any }) => {
    // Append user selection message
    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: option.label,
    };

    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      processBotAction(option.action, option.payload);
    }, 300);
  };

  const processBotAction = (action: string, payload?: any) => {
    if (action === 'explore_products') {
      const productOptions = products.map((p) => ({
        label: p.name,
        action: 'product_detail',
        payload: p,
      }));
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: 'Here are our core enterprise platforms currently deployed across global industries. Select a system to view capabilities:',
          options: [
            ...productOptions,
            { label: '« Back to Main Menu', action: 'main_menu' },
          ],
        },
      ]);
    } else if (action === 'product_detail') {
      const prod = payload as ProductRecord;
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `**${prod.name}**\n\n${prod.summary}\n\nKey Capabilities:\n• ${prod.features.slice(0, 3).join('\n• ')}`,
          options: [
            {
              label: `Request ${prod.name} Architecture Brief`,
              action: 'prepare_rfp',
              payload: prod.name,
            },
            { label: 'View Other Platforms', action: 'explore_products' },
            { label: '« Back to Main Menu', action: 'main_menu' },
          ],
        },
      ]);
    } else if (action === 'start_advisor') {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: 'What is the primary industry or operating domain of your organization?',
          options: [
            { label: 'Athletic, Gym or Health Clubs', action: 'recommend', payload: 'gym-management' },
            { label: 'E-Commerce, Retail or Wholesale B2B', action: 'recommend', payload: 'e-commerce' },
            { label: 'Workforce Training & Compliance LMS', action: 'recommend', payload: 'learning-management-system' },
            { label: 'Clinical Healthcare & Medicare', action: 'recommend', payload: 'medicare-healthcare-management' },
            { label: 'Custom Enterprise Engineering', action: 'show_rfp_form' },
          ],
        },
      ]);
    } else if (action === 'recommend') {
      const slug = payload as string;
      const matched = products.find((p) => p.slug === slug);
      if (matched) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: `Based on your domain, **${matched.name}** is engineered specifically for your requirements.\n\n${matched.description.slice(0, 200)}...`,
            options: [
              { label: `Submit ${matched.name} Specs`, action: 'prepare_rfp', payload: matched.name },
              { label: 'Read Full Product Page', action: 'navigate_product', payload: matched.slug },
              { label: 'Explore Other Solutions', action: 'start_advisor' },
            ],
          },
        ]);
      }
    } else if (action === 'navigate_product') {
      window.location.href = `/product?select=${payload}`;
    } else if (action === 'show_faqs') {
      const faqs = activeSettings?.faqs || [];
      const faqOptions = faqs.map((f) => ({
        label: f.question,
        action: 'faq_answer',
        payload: f,
      }));
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: 'Select a frequently asked technical question:',
          options: [
            ...faqOptions,
            { label: 'Speak with a Human Architect', action: 'show_rfp_form' },
            { label: '« Back to Main Menu', action: 'main_menu' },
          ],
        },
      ]);
    } else if (action === 'faq_answer') {
      const faq = payload;
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `${faq.answer}`,
          options: [
            { label: 'Ask Another Question', action: 'show_faqs' },
            { label: 'Submit Technical Proposal Request', action: 'show_rfp_form' },
            { label: '« Back to Main Menu', action: 'main_menu' },
          ],
        },
      ]);
    } else if (action === 'prepare_rfp') {
      setLeadForm((prev) => ({ ...prev, productInterest: payload || '' }));
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `Please enter your contact details and high-level requirements for ${payload || 'our platforms'}. Our solutions engineering team will review and follow up with a proposal.`,
          isForm: true,
        },
      ]);
    } else if (action === 'show_rfp_form') {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: 'Please provide your details below. Submissions are saved securely to our database and notified directly to our solutions lead.',
          isForm: true,
        },
      ]);
    } else if (action === 'main_menu') {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: 'What would you like to explore next?',
          options: [
            { label: 'Explore Platforms', action: 'explore_products' },
            { label: 'Help Me Choose a Solution', action: 'start_advisor' },
            { label: 'Technical FAQs', action: 'show_faqs' },
            { label: 'Submit Requirements / RFP', action: 'show_rfp_form' },
          ],
        },
      ]);
    }
  };

  // Rule-based keyword search on user manual text input
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      { id: 'usr-' + Date.now(), sender: 'user', text: userText },
    ]);

    setTimeout(() => {
      const lower = userText.toLowerCase();
      const faqs = activeSettings?.faqs || [];

      // Check matched FAQ by keywords
      const matchedFaq = faqs.find((f) =>
        f.keywords.some((k) => lower.includes(k.toLowerCase())) ||
        lower.includes(f.question.toLowerCase())
      );

      if (matchedFaq) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: matchedFaq.answer,
            options: [
              { label: 'Submit Specifications', action: 'show_rfp_form' },
              { label: '« Back to Main Menu', action: 'main_menu' },
            ],
          },
        ]);
        return;
      }

      // Check product match
      const matchedProd = products.find((p) =>
        lower.includes(p.slug) ||
        lower.includes(p.name.toLowerCase()) ||
        (p.slug.includes('gym') && (lower.includes('fitness') || lower.includes('gym') || lower.includes('athletic'))) ||
        (p.slug.includes('commerce') && (lower.includes('shop') || lower.includes('store') || lower.includes('cart') || lower.includes('b2b'))) ||
        (p.slug.includes('lms') && (lower.includes('training') || lower.includes('course') || lower.includes('education') || lower.includes('scorm'))) ||
        (p.slug.includes('medicare') && (lower.includes('health') || lower.includes('clinic') || lower.includes('medical') || lower.includes('patient') || lower.includes('doctor')))
      );

      if (matchedProd) {
        processBotAction('product_detail', matchedProd);
        return;
      }

      // Fallback response with structured choices
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: `Thank you for your question. While I am a rule-based advisor, our principal solutions architects can provide an in-depth answer tailored to your enterprise architecture. Would you like to log your requirements, or select one of the topics below?`,
          options: [
            { label: 'Log Requirements for an Architect', action: 'show_rfp_form' },
            { label: 'Explore Core Platforms', action: 'explore_products' },
            { label: 'Browse Technical FAQs', action: 'show_faqs' },
          ],
        },
      ]);
    }, 400);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.email || !leadForm.requirements) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });
      const data = await res.json();
      if (res.ok) {
        setLeadSubmitted(true);
        setLeadRefId(data.leadId || '');
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: `Thank you, ${leadForm.name}. Your specifications have been logged securely in our enterprise repository (Ref: ${data.leadId}). An Azaroth solutions architect will contact you at ${leadForm.email} within 24 business hours.`,
            options: [
              { label: 'Explore Other Solutions', action: 'explore_products' },
              { label: '« Back to Main Menu', action: 'main_menu' },
            ],
          },
        ]);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Floating Toggle Button synchronized with active theme or custom color */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-slate-400/30"
          style={{
            background: resolvedLauncherBg,
          }}
          aria-label={`Open ${botName}`}
        >
          {/* Chat speech bubble icon */}
          <div className="w-7 h-7 relative flex items-center justify-center">
            <svg
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 drop-shadow-xs"
            >
              <path
                d="M5 6C5 4.34315 6.34315 3 8 3H20C21.6569 3 23 4.34315 23 6V16C23 17.6569 21.6569 19 20 19H9.5L5 23.5V6Z"
                fill={resolvedLauncherIcon}
              />
              <rect x="8.5" y="7.5" width="11" height="2" rx="1" fill={primaryColor} />
              <rect x="8.5" y="11" width="11" height="2" rx="1" fill={accentColor} />
              <rect x="8.5" y="14.5" width="7" height="2" rx="1" fill={primaryColor} />
            </svg>
          </div>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={botName}
          className="w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px] h-[560px] max-h-[85dvh] rounded-2xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ backgroundColor: resolvedWindowBg }}
        >
          {/* Header with theme gradient or custom background */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{
              background: resolvedHeaderBg,
              color: resolvedHeaderText,
            }}
          >
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={botName}
                  className="w-8 h-8 rounded-full object-cover border border-white/30 shadow-xs shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs shrink-0">
                  <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5">
                    <path
                      d="M5 6C5 4.34315 6.34315 3 8 3H20C21.6569 3 23 4.34315 23 6V16C23 17.6569 21.6569 19 20 19H9.5L5 23.5V6Z"
                      fill="white"
                    />
                    <rect x="8.5" y="7.5" width="11" height="2" rx="1" fill={primaryColor} />
                    <rect x="8.5" y="11" width="11" height="2" rx="1" fill={accentColor} />
                    <rect x="8.5" y="14.5" width="7" height="2" rx="1" fill={primaryColor} />
                  </svg>
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold leading-tight" style={{ color: resolvedHeaderText }}>
                  {botName}
                </h3>
                <p className="text-[11px] opacity-80" style={{ color: resolvedHeaderText }}>{statusText}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md transition-colors cursor-pointer opacity-80 hover:opacity-100"
              style={{ color: resolvedHeaderText }}
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages scroll area */}
          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3.5" style={{ backgroundColor: resolvedWindowBg }}>
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'rounded-br-none shadow-xs'
                      : 'border border-slate-200 shadow-xs rounded-bl-none'
                  }`}
                  style={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: m.sender === 'user' ? resolvedUserBubbleBg : resolvedBotBubbleBg,
                    color: m.sender === 'user' ? resolvedUserBubbleText : resolvedBotBubbleText,
                  }}
                >
                  {m.text}
                </div>

                {/* Option Buttons */}
                {m.options && m.options.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 w-full">
                    {m.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt)}
                        style={{
                          backgroundColor: resolvedActionButtonBg,
                          color: resolvedActionButtonText,
                          borderColor: resolvedActionButtonBorder,
                        }}
                        className="text-[11px] font-medium px-3 py-1.5 border rounded-lg shadow-2xs hover:opacity-85 transition-all flex items-center gap-1 cursor-pointer text-left"
                      >
                        <span>{opt.label}</span>
                        <ChevronRight className="w-3 h-3 opacity-60 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Inline Structured Requirements Form */}
                {m.isForm && !leadSubmitted && (
                  <form
                    onSubmit={handleLeadSubmit}
                    className={`mt-3 w-full p-3.5 rounded-xl border shadow-sm space-y-2 text-xs ${
                      isPublicDark ? 'bg-[#1E2337] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${
                        isPublicDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                        placeholder="Enter your name"
                        className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-[#35123F] ${
                          isPublicDark ? 'bg-[#131624] border-slate-600 text-white placeholder:text-slate-500' : 'border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${
                        isPublicDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Business Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={leadForm.email}
                        onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                        placeholder="Enter email"
                        className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-[#35123F] ${
                          isPublicDark ? 'bg-[#131624] border-slate-600 text-white placeholder:text-slate-500' : 'border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${
                          isPublicDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Company / Org
                        </label>
                        <input
                          type="text"
                          value={leadForm.company}
                          onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                          placeholder="Company name"
                          className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-[#35123F] ${
                            isPublicDark ? 'bg-[#131624] border-slate-600 text-white placeholder:text-slate-500' : 'border-slate-300 text-slate-900'
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${
                          isPublicDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Product Interest
                        </label>
                        <select
                          value={leadForm.productInterest}
                          onChange={(e) => setLeadForm({ ...leadForm, productInterest: e.target.value })}
                          className={`w-full px-2 py-1.5 border rounded text-xs outline-none focus:ring-1 focus:ring-[#35123F] ${
                            isPublicDark ? 'bg-[#131624] border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="">Select Platform</option>
                          <option value="Gym Management">Gym Management</option>
                          <option value="Enterprise Commerce">Enterprise Commerce</option>
                          <option value="Enterprise LMS">Enterprise LMS</option>
                          <option value="MediCare Clinical Suite">MediCare Clinical Suite</option>
                          <option value="Custom Engineering">Custom Engineering</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={`block text-[10px] font-semibold uppercase mb-0.5 ${
                        isPublicDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Operational Requirements *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={leadForm.requirements}
                        onChange={(e) => setLeadForm({ ...leadForm, requirements: e.target.value })}
                        placeholder="Describe your current infrastructure, transaction volume, or timeline..."
                        className={`w-full px-2.5 py-1.5 border rounded text-xs outline-none resize-none focus:ring-1 focus:ring-[#35123F] ${
                          isPublicDark ? 'bg-[#131624] border-slate-600 text-white placeholder:text-slate-500' : 'border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2 text-white font-semibold rounded uppercase tracking-wider text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-xs"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isSubmitting ? 'Logging Specifications...' : 'Submit Specifications'}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>

          {/* Text input footer */}
          <form
            onSubmit={handleTextSubmit}
            className={`p-3 border-t flex items-center gap-2 ${
              isPublicDark ? 'bg-[#1E2337] border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a technical or platform question..."
              className={`flex-1 px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 ${
                isPublicDark
                  ? 'bg-[#131624] border-slate-600 text-white placeholder:text-slate-400 focus:ring-slate-500/30'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:ring-slate-400/30'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-lg disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
              style={{ backgroundColor: resolvedSendButtonBg, color: resolvedSendButtonText }}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
