import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('ath_token');
    fetch('/api/admin/health', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900">Portable Deployment & Telemetry</h2>
        <p className="text-xs text-slate-500 mt-1">
          Inspect server runtime state, Neon PostgreSQL connection, Brevo SMTP status, and customer-owned Docker infrastructure.
        </p>
      </div>

      {/* Live Health Status Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Server className="w-4 h-4 text-[#35123F]" />
          <span>Active Runtime Health Status</span>
        </h3>

        {loading ? (
          <p className="text-xs text-slate-500">Checking health endpoint...</p>
        ) : health ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Application Server</span>
              </span>
              <p className="text-sm font-bold text-emerald-950 capitalize">{health.status}</p>
              <p className="text-[10px] text-emerald-700 font-mono">Env: {health.environment}</p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#D5A13C]" />
                <span>Database Engine</span>
              </span>
              <p className="text-sm font-bold text-slate-900">
                {health.database?.type === 'neon-postgresql'
                  ? 'Neon PostgreSQL (Live SSL)'
                  : 'Local Store (Zero-Crash Fallback)'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {health.database?.productsCount} products • {health.database?.leadsCount} leads
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#35123F]" />
                <span>Transactional Email</span>
              </span>
              <p className="text-sm font-bold text-slate-900">
                {health.smtpConfigured ? 'Brevo SMTP Active' : 'Simulation Queue Active'}
              </p>
              <p className="text-[10px] text-slate-500">Zero lead loss guaranteed</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            Health check endpoint unreachable.
          </div>
        )}
      </div>

      {/* Customer-Owned Docker Deployment Guide */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-700" />
          <span>Customer-Owned Portable Infrastructure Instructions</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Azaroth Tech-Hive is fully portable and requires no proprietary cloud lock-in. To deploy to your own AWS, GCP, Azure, or on-premise Kubernetes cluster:
        </p>

        {/* Command 1: Docker Build */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">1. Build Docker Container</span>
            <button
              onClick={() =>
                copyToClipboard('docker build -t azaroth-tech-hive:latest .', 'c1')
              }
              className="text-[#35123F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied === 'c1' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-[#171B2C] text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto">
            docker build -t azaroth-tech-hive:latest .
          </pre>
        </div>

        {/* Command 2: Docker Run */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">2. Run with Neon PostgreSQL & Brevo SMTP</span>
            <button
              onClick={() =>
                copyToClipboard(
                  'docker run -d -p 3000:3000 -e DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require" -e BREVO_SMTP_HOST="smtp-relay.brevo.com" -e BREVO_SMTP_PORT=587 -e BREVO_SMTP_USERNAME="user" -e BREVO_SMTP_PASSWORD="pwd" azaroth-tech-hive:latest',
                  'c2'
                )
              }
              className="text-[#35123F] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copied === 'c2' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="bg-[#171B2C] text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto">
            {`docker run -d -p 3000:3000 \\
  -e DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require" \\
  -e BREVO_SMTP_HOST="smtp-relay.brevo.com" \\
  -e BREVO_SMTP_PORT=587 \\
  -e BREVO_SMTP_USERNAME="user" \\
  -e BREVO_SMTP_PASSWORD="pwd" \\
  azaroth-tech-hive:latest`}
          </pre>
        </div>
      </div>
    </div>
  );
};
