import React, { useState, useEffect } from 'react';
import { X, Search, Upload, Check, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { MediaItem } from '../../types';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  filter?: 'all' | 'image' | 'video';
  title?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  filter = 'image',
  title = 'Select Media Asset',
}) => {
  const { token } = useAuth();
  const { cmsMode } = useTheme();
  const isLight = cmsMode === 'light';

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>(filter);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/media', { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMedia(data);
      }
    } catch (err) {
      console.warn('Failed loading media for picker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMedia();
      setFilterType(filter);
      setSearch('');
      setUploadError(null);
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', file.name.replace(/\.[^/.]+$/, ''));

      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onSelect(data);
        onClose();
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch {
      setUploadError('Network error uploading file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = media.filter((m) => {
    const matchType = filterType === 'all' || m.mediaType === filterType;
    const matchSearch =
      m.originalName.toLowerCase().includes(search.toLowerCase()) ||
      (m.altText || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`rounded-2xl border shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#131624] border-slate-800 text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#171B2C] text-white flex items-center justify-between shrink-0 border-b border-[#D5A13C]/20">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-[#D5A13C]" />
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            aria-label="Close Media Picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search, Filter, and Quick Upload Bar */}
        <div
          className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161B2E] border-slate-800'
          }`}
        >
          <div
            className={`flex items-center gap-1 p-1 rounded-lg border w-full sm:w-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                filterType === 'all'
                  ? 'bg-[#35123F] text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('image')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                filterType === 'image'
                  ? 'bg-[#35123F] text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Images
            </button>
            <button
              type="button"
              onClick={() => setFilterType('video')}
              className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                filterType === 'video'
                  ? 'bg-[#35123F] text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Videos
            </button>
          </div>

          <div className="relative flex-1 max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename or alt..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none focus:border-[#35123F] border ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-700 text-slate-100'
              }`}
            />
          </div>

          <label className="px-3.5 py-1.5 bg-[#35123F] hover:bg-[#24102D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5 text-[#D5A13C]" />
            <span>{uploading ? 'Uploading...' : 'Quick Upload'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,video/mp4,video/webm"
              onChange={handleQuickUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {uploadError && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Media Grid */}
        <div
          className={`p-6 overflow-y-auto flex-1 ${
            isLight ? 'bg-[#FAF7F2]/40' : 'bg-[#0B0D17]'
          }`}
        >
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <div className="w-7 h-7 border-2 border-[#35123F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading media assets...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className={`py-16 text-center rounded-xl border p-8 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#161B2E] border-slate-800'
              }`}
            >
              <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h4 className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                No media assets found
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Upload a new PNG, JPEG, SVG, or WebP image using the Quick Upload button above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`group relative rounded-xl border overflow-hidden shadow-2xs hover:shadow-md hover:border-[#35123F] transition-all cursor-pointer flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#161B2E] border-slate-800'
                  }`}
                >
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                    {item.mediaType === 'video' ? (
                      <video
                        src={item.url}
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.altText || item.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {item.url.startsWith('/src/assets') && (
                      <span className="absolute top-1.5 left-1.5 bg-indigo-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Website Asset
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <Check className="w-4 h-4 text-[#D5A13C]" />
                      <span>Select Asset</span>
                    </div>
                  </div>

                  <div className="p-2.5 space-y-0.5">
                    <p
                      className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
                      title={item.originalName}
                    >
                      {item.originalName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {(item.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#161B2E] border-slate-800 text-slate-400'
          }`}
        >
          <span>{filtered.length} assets available</span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
              isLight
                ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
