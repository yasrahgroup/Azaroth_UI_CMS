import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Mail,
  Bot,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ContactEnquiry, ChatbotLead } from '../../types';

export const LeadsInbox: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'leads' | 'enquiries'>('leads');
  const [leads, setLeads] = useState<ChatbotLead[]>([]);
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const [leadsRes, enqRes] = await Promise.all([
        fetch('/api/leads', { headers }),
        fetch('/api/enquiries', { headers }),
      ]);

      if (leadsRes.ok) setLeads(await leadsRes.json());
      if (enqRes.ok) setEnquiries(await enqRes.json());
    } catch (err) {
      console.warn('Failed loading inbox data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleUpdateStatus = async (
    type: 'lead' | 'enquiry',
    id: string,
    status: 'new' | 'in_progress' | 'resolved'
  ) => {
    const activeToken = token || localStorage.getItem('ath_token');
    if (!activeToken) return;
    const endpoint = type === 'lead' ? `/api/leads/${id}/status` : `/api/enquiries/${id}/status`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        if (type === 'lead') {
          setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
        } else {
          setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
        }
      }
    } catch {}
  };

  const handleExportCsv = () => {
    const data = activeTab === 'leads' ? leads : enquiries;
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `azaroth_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(search.toLowerCase())) ||
      (l.productInterest && l.productInterest.toLowerCase().includes(search.toLowerCase())) ||
      l.requirements.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const filteredEnquiries = enquiries.filter((e) => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.message.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leads & Contact Enquiries</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review captured enterprise requirements, consult proposals, and contact submissions.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {activeTab === 'leads' ? 'Leads' : 'Enquiries'} CSV</span>
        </button>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'leads'
                ? 'bg-[#35123F] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Chatbot Solution Leads ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'enquiries'
                ? 'bg-[#35123F] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Direct Inquiries ({enquiries.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="new">New (Unreviewed)</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#35123F]"
            />
          </div>
        </div>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          Loading submissions...
        </div>
      ) : activeTab === 'leads' ? (
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
              No chatbot requirements captured yet.
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">{lead.name}</span>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-xs text-[#35123F] hover:underline"
                    >
                      {lead.email}
                    </a>
                    {lead.phone && (
                      <span className="text-xs text-slate-500 font-mono">({lead.phone})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(lead.createdAt).toLocaleString()}
                    </span>
                    <select
                      value={lead.status}
                      onChange={(e) =>
                        handleUpdateStatus('lead', lead.id, e.target.value as any)
                      }
                      className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                        lead.status === 'new'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : lead.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {lead.company && (
                    <div>
                      <span className="font-semibold text-slate-500 block">Company / Entity</span>
                      <span className="text-slate-800">{lead.company}</span>
                    </div>
                  )}
                  {lead.businessType && (
                    <div>
                      <span className="font-semibold text-slate-500 block">Business Type</span>
                      <span className="text-slate-800">{lead.businessType}</span>
                    </div>
                  )}
                  {lead.productInterest && (
                    <div>
                      <span className="font-semibold text-slate-500 block">Platform Interest</span>
                      <span className="text-[#35123F] font-bold">{lead.productInterest}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {lead.requirements}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
              No contact enquiries received yet.
            </div>
          ) : (
            filteredEnquiries.map((enq) => (
              <div
                key={enq.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">{enq.name}</span>
                    <a
                      href={`mailto:${enq.email}`}
                      className="text-xs text-[#35123F] hover:underline"
                    >
                      {enq.email}
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(enq.createdAt).toLocaleString()}
                    </span>
                    <select
                      value={enq.status}
                      onChange={(e) =>
                        handleUpdateStatus('enquiry', enq.id, e.target.value as any)
                      }
                      className={`text-xs px-2.5 py-1 rounded font-semibold border ${
                        enq.status === 'new'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : enq.status === 'in_progress'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="font-semibold text-slate-500">Subject: </span>
                  <span className="font-bold text-slate-800">{enq.subject}</span>
                  {enq.productInterest && (
                    <span className="ml-3 text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      Interested in: {enq.productInterest}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {enq.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
