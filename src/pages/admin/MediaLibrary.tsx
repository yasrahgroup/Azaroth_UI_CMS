import React, { useState, useEffect } from 'react';
import {
  Upload,
  Download,
  Image as ImageIcon,
  Video,
  Copy,
  Trash2,
  Pencil,
  Check,
  Search,
  ExternalLink,
  Film,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { uploadAdminMedia } from '../../utils/mediaUpload';
import type { MediaItem } from '../../types';

export const MediaLibrary: React.FC = () => {
  const { token } = useAuth();
  const { cmsMode } = useTheme();
  const isLight = cmsMode === 'light';

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [editingAltId, setEditingAltId] = useState<string | null>(null);
  const [tempAlt, setTempAlt] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const loadMedia = async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/media', { headers });
      if (res.ok) {
        const data = await res.json();
        setMedia(data);
      }
    } catch (err) {
      console.warn('Failed loading media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const result = await uploadAdminMedia(files[0], { token });
      if (result.ok) {
        setFeedbackIsError(false);
        setFeedback('File uploaded successfully');
        loadMedia();
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
        setTimeout(() => setFeedback(null), 4000);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      const absoluteUrl = /^https?:\/\//i.test(url) ? url : new URL(url, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteUrl);
      setFeedbackIsError(false);
      setFeedback('URL copied to clipboard');
    } catch {
      setFeedbackIsError(true);
      setFeedback('Could not copy URL to clipboard');
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;

    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setFeedbackIsError(false);
        setFeedback('Asset deleted');
        loadMedia();
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedbackIsError(true);
        setFeedback(data?.error || 'Delete failed - the asset was not removed');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Delete failed due to network error');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSaveAlt = async (id: string) => {
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`/api/media/${id}/alt`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ altText: tempAlt }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setFeedbackIsError(false);
        setEditingAltId(null);
        setFeedback('Alt text updated');
        loadMedia();
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedbackIsError(true);
        setFeedback(data?.error || 'Alt text update failed');
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Alt text update failed due to network error');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSaveName = async (id: string) => {
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers.Authorization = ['Bearer', activeToken].join(' ');

      const res = await fetch(`/api/media/${id}/name`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ originalName: tempName }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setFeedbackIsError(false);
        setEditingNameId(null);
        setFeedback('Media name updated');
        loadMedia();
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setFeedbackIsError(true);
        setFeedback(data?.error || 'Media name update failed');
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Media name update failed due to network error');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDownload = async (item: MediaItem) => {
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers.Authorization = ['Bearer', activeToken].join(' ');

      const res = await fetch(`/api/media/${item.id}/download`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Download failed');
      }

      const objectUrl = URL.createObjectURL(await res.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = item.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setFeedbackIsError(false);
      setFeedback('Download started');
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setFeedbackIsError(true);
      setFeedback(err instanceof Error ? err.message : 'Media download failed');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const filtered = media.filter((m) => {
    const matchesFilter = filterType === 'all' || m.mediaType === filterType;
    const matchesSearch =
      m.originalName.toLowerCase().includes(search.toLowerCase()) ||
      (m.altText || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Media & Asset Storage Library
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Website Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse and manage all images and videos used on the website, product catalogs, hero banners, and custom cursors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {feedback && (
            <span
              className={
                feedbackIsError
                  ? 'text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded font-medium flex items-center gap-1.5 shadow-2xs'
                  : 'text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded font-medium flex items-center gap-1.5 shadow-2xs'
              }
            >
              {feedbackIsError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              {feedback}
            </span>
          )}
          <label className="px-4 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload Media File'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className={`p-4 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
        }`}
      >
        <div
          className={`flex items-center gap-1 p-1 rounded-lg ${
            isLight ? 'bg-slate-100' : 'bg-[#1B2035]'
          }`}
        >
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
              filterType === 'all'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-white shadow-xs font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Assets ({media.length})
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
              filterType === 'image'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-white shadow-xs font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
              filterType === 'video'
                ? isLight
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-slate-800 text-white shadow-xs font-bold'
                : isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Videos
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename or alt..."
            className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-lg outline-none focus:border-[#35123F] ${
              isLight
                ? 'border-slate-300 bg-white text-slate-800'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-16 text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading media library...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className={`text-center py-16 rounded-xl border p-8 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
          }`}
        >
          <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
          <h3 className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
            No media assets found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Upload images (JPEG, PNG, WebP) or video files (MP4, WebM) above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#131624] border-slate-800'
              }`}
            >
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                {item.mediaType === 'video' ? (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt={item.altText}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {item.mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
                </span>
                {item.url.startsWith('/src/assets') && (
                  <span className="absolute top-2 right-2 bg-indigo-600/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    Website Asset
                  </span>
                )}
              </div>

              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  {editingNameId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        aria-label="Media display name"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        maxLength={255}
                        className={`w-full px-2 py-1 text-xs border rounded ${
                          isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900 text-white'
                        }`}
                      />
                      <button
                        onClick={() => handleSaveName(item.id)}
                        aria-label="Save media name"
                        className="p-1 bg-[#35123F] text-white rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <p
                        className={`text-xs font-bold truncate flex-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
                        title={item.originalName}
                      >
                        {item.originalName}
                      </p>
                      <button
                        onClick={() => {
                          setEditingNameId(item.id);
                          setTempName(item.originalName);
                        }}
                        aria-label={`Rename ${item.originalName}`}
                        className="p-1 text-slate-400 hover:text-[#35123F] rounded"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {(item.sizeBytes / 1024).toFixed(1)} KB • {new Date(item.uploadedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Alt text editor */}
                <div className={`pt-2 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  {editingAltId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempAlt}
                        onChange={(e) => setTempAlt(e.target.value)}
                        className={`w-full px-2 py-1 text-[11px] border rounded ${
                          isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-900 text-white'
                        }`}
                        placeholder="Alt description"
                      />
                      <button
                        onClick={() => handleSaveAlt(item.id)}
                        className="p-1 bg-[#35123F] text-white rounded text-[10px] font-bold"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        setEditingAltId(item.id);
                        setTempAlt(item.altText);
                      }}
                      className="text-[11px] text-slate-500 truncate cursor-pointer hover:text-[#35123F]"
                      title="Click to edit alt text"
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Alt:</span>
                      <span>{item.altText || 'Add alt text...'}</span>
                    </div>
                  )}
                </div>

                <div className={`pt-2 border-t flex items-center justify-between text-xs ${
                  isLight ? 'border-slate-100' : 'border-slate-800'
                }`}>
                  <button
                    onClick={() => handleCopyUrl(item.url)}
                    className="flex items-center gap-1 text-[#35123F] hover:underline cursor-pointer font-medium"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy URL</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(item)}
                      aria-label={`Download ${item.originalName}`}
                      className="p-1 text-slate-400 hover:text-[#35123F] rounded cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
