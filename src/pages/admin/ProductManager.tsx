import React, { useState, useEffect } from 'react';
import {
  Box,
  Plus,
  Edit2,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Save,
  X,
  Layers,
  ArrowUp,
  ArrowDown,
  Upload,
  Grid,
  Image as ImageIcon,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { MediaPickerModal } from '../../components/admin/MediaPickerModal';
import { ProductStageBadge } from '../../components/public/ProductStageBadge';
import { uploadAdminMedia } from '../../utils/mediaUpload';
import type { ProductRecord } from '../../types';

export const ProductManager: React.FC = () => {
  const { token } = useAuth();
  const { editorSettings, updateDraftSettings, publishSettings, isSaving } = useTheme();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductRecord> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newBenefit, setNewBenefit] = useState('');
  const [newUseCase, setNewUseCase] = useState('');
  const [uploadingHero, setUploadingHero] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleUploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setUploadingHero(true);
    try {
      const result = await uploadAdminMedia(file, {
        altText: editingProduct.name || file.name,
        token,
      });
      if (result.ok) {
        setEditingProduct({ ...editingProduct, heroImage: result.media.url });
        setFeedbackIsError(false);
        setFeedback('Hero PNG uploaded successfully');
      } else {
        setFeedbackIsError(true);
        setFeedback(result.error);
      }
    } finally {
      setUploadingHero(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/products/all', { headers });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.warn('Failed loading all products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const handleEdit = (p: ProductRecord) => {
    setEditingProduct(JSON.parse(JSON.stringify(p)));
    setIsNew(false);
  };

  const handleCreateNew = () => {
    setEditingProduct({
      id: 'prod-' + Date.now(),
      name: '',
      slug: '',
      summary: '',
      description: '',
      heroImage: '/src/assets/images/product_gym_mgmt_1792419734268.jpg',
      heroImageAlt: '',
      galleryImages: [],
      features: ['Enterprise Authentication', 'API Microservices Connector'],
      benefits: ['Reduced integration overhead', 'Continuous audit readiness'],
      useCases: ['Enterprise Organizations'],
      ctaLabel: 'Schedule Technical Discovery',
      ctaDestination: '#contact',
      metaTitle: '',
      metaDescription: '',
      stage: 'Live',
      isPublished: true,
      displayOrder: products.length + 1,
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || !editingProduct.slug) return;

    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        setFeedbackIsError(false);
        setFeedback(isNew ? 'Product created successfully' : 'Product updated successfully');
        setEditingProduct(null);
        setIsNew(false);
        loadProducts();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const err = await res.json().catch(() => null);
        setFeedbackIsError(true);
        setFeedback(err?.error || 'Product could not be saved');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Error saving product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this product?')) return;

    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {};
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers,
      });
      const err = await res.json().catch(() => null);
      if (res.ok) {
        setFeedbackIsError(false);
        setFeedback('Product deleted');
        loadProducts();
        setTimeout(() => setFeedback(null), 2500);
      } else {
        setFeedbackIsError(true);
        setFeedback(err?.error || 'Product could not be deleted');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Delete error');
    }
  };

  const handleTogglePublish = async (p: ProductRecord) => {
    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...p, isPublished: !p.isPublished }),
      });
      if (res.ok) {
        setFeedbackIsError(false);
        setFeedback(p.isPublished ? 'Product unpublished' : 'Product published');
        loadProducts();
        setTimeout(() => setFeedback(null), 2500);
      } else {
        const err = await res.json().catch(() => null);
        setFeedbackIsError(true);
        setFeedback(err?.error || 'Publish state could not be changed');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedbackIsError(true);
      setFeedback('Publish state could not be changed');
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleMoveProduct = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= products.length) return;

    const reordered = [...products];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    const updated = reordered.map((p, i) => ({ ...p, displayOrder: i + 1 }));
    setProducts(updated);

    try {
      const activeToken = token || localStorage.getItem('ath_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

      let failed = false;
      for (const p of updated) {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers,
          body: JSON.stringify(p),
        });
        if (!res.ok) {
          failed = true;
          break;
        }
      }
      if (failed) {
        setFeedbackIsError(true);
        setFeedback('Product order was not saved - the list was reloaded from the server');
        setTimeout(() => setFeedback(null), 4000);
        loadProducts();
        return;
      }
      setFeedbackIsError(false);
      setFeedback('Product order updated');
      setTimeout(() => setFeedback(null), 2000);
    } catch {
      setFeedbackIsError(true);
      setFeedback('Failed to update product order');
      setTimeout(() => setFeedback(null), 3500);
      loadProducts();
    }
  };

  const productGridCfg = editorSettings?.productGrid || { columns: 2, cardStyle: 'standard' };

  const handleUpdateGrid = async (field: 'columns' | 'cardStyle', val: any) => {
    const updated = {
      ...productGridCfg,
      [field]: val,
    };
    await updateDraftSettings({ productGrid: updated });
    setFeedback('Product grid configuration saved');
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Database-backed catalog. Add, edit, reorder, publish, and configure platform specifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <button
            onClick={async () => {
              await publishSettings();
              setFeedback('Grid settings & catalog layout published live!');
              setTimeout(() => setFeedback(null), 3000);
            }}
            disabled={isSaving}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white rounded text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Publishing...' : 'Publish Grid Live'}
          </button>
          <button
            onClick={handleCreateNew}
            className="px-3.5 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Product</span>
          </button>
        </div>
      </div>

      {/* Customizable Product Grid Layout Settings */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-[#35123F]" />
            <h3 className="text-sm font-bold text-slate-800">Customizable Product Grid Layout</h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
            {productGridCfg.columns} Columns • {productGridCfg.cardStyle || 'standard'} style
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column Count Option */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Desktop Grid Columns
            </label>
            <p className="text-[11px] text-slate-500">
              Control the number of platform cards displayed per row on desktop screens.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[1, 2, 3, 4].map((cols) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => handleUpdateGrid('columns', cols)}
                  className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                    productGridCfg.columns === cols
                      ? 'border-[#35123F] bg-[#35123F]/5 text-[#35123F] font-bold ring-2 ring-[#35123F]/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">{cols}</div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                    {cols === 2 ? '2x2 Default' : cols === 1 ? 'Single' : `${cols} Cols`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card Style Option */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Platform Card Style
            </label>
            <p className="text-[11px] text-slate-500">
              Choose the depth of technical presentation rendered in public catalog cards.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: 'standard', label: 'Standard', desc: 'Balanced summary' },
                { id: 'compact', label: 'Compact', desc: 'High-density cards' },
                { id: 'detailed', label: 'Detailed', desc: 'Specs & outcomes' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => handleUpdateGrid('cardStyle', style.id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    (productGridCfg.cardStyle || 'standard') === style.id
                      ? 'border-[#35123F] bg-[#35123F]/5 text-[#35123F] font-bold ring-2 ring-[#35123F]/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold capitalize">{style.label}</div>
                  <div className="text-[9px] text-slate-500">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Behavior Note */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#D5A13C]" />
            <span>
              <strong>Responsive Architecture:</strong> Automatically adapts to <strong>1 column on mobile</strong>, <strong>2 columns on tablet</strong>, and your selected <strong>{productGridCfg.columns} columns on desktop</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold uppercase text-slate-600">
          <span>Enterprise Products ({products.length})</span>
          <span>Status & Actions</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading platform records...
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No products found in the database.
            </div>
          ) : (
            products.map((p, idx) => (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {p.heroImage ? (
                      <img
                        src={p.heroImage}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[10px]">
                        No img
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{p.name}</h4>
                      <ProductStageBadge stage={p.stage} />
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xl">
                      {p.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleMoveProduct(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveProduct(idx, 'down')}
                    disabled={idx === products.length - 1}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-500 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleTogglePublish(p)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                      p.isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {p.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{p.isPublished ? 'Published' : 'Draft Staging'}</span>
                  </button>

                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit / Create Product Modal Drawer */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#171B2C] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isNew ? 'Create New Product' : `Edit Product: ${editingProduct.name}`}
                </h3>
                <p className="text-[11px] text-[#D5A13C]">
                  Configure fields, benefits, and capabilities
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Platform Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = isNew
                        ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                        : editingProduct.slug;
                      setEditingProduct({ ...editingProduct, name, slug });
                    }}
                    placeholder="Enter platform name"
                    className="w-full px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    URL Slug * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.slug || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, slug: e.target.value })
                    }
                    placeholder="Enter slug"
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Stage *
                  </label>
                  <select
                    value={editingProduct.stage || 'Live'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stage: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white font-medium"
                  >
                    <option value="Under Development">Under Development (Amber)</option>
                    <option value="Ready for Deployment">Ready for Deployment (Blue)</option>
                    <option value="Commercial Launch">Commercial Launch (Teal)</option>
                    <option value="Live">Live (Green)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Summary Teaser *
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingProduct.summary || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, summary: e.target.value })
                  }
                  placeholder="Summary overview..."
                  className="w-full px-3 py-2 border border-slate-300 rounded resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Architecture Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  placeholder="Detailed architectural specifications..."
                  className="w-full px-3 py-2 border border-slate-300 rounded resize-none"
                />
              </div>

              {/* Image Field: Both URL Input and Option to Upload PNG */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700">
                  Platform Image (Image URL or Upload PNG file)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editingProduct.heroImage || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, heroImage: e.target.value })
                    }
                    placeholder="Enter image URL or choose from library"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-[#35123F] outline-none"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-300 transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#35123F]" />
                      <span>Media Library</span>
                    </button>
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#D5A13C]" />
                      <span>{uploadingHero ? 'Uploading...' : 'Upload PNG'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleUploadHeroImage}
                        disabled={uploadingHero}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {editingProduct.heroImage && (
                  <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={editingProduct.heroImage}
                        alt="Hero preview"
                        className="w-12 h-10 object-cover rounded border border-slate-200 shrink-0"
                      />
                      <span className="text-[11px] text-slate-600 truncate font-mono">
                        {editingProduct.heroImage}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, heroImage: '' })}
                      className="text-xs text-rose-600 hover:text-rose-800 font-medium shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={editingProduct.ctaLabel || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, ctaLabel: e.target.value })
                  }
                  placeholder="Button label"
                  className="w-full px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-700">
                  Feature Checklist Items ({editingProduct.features?.length || 0})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add feature capability..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFeature.trim()) return;
                      const features = [...(editingProduct.features || []), newFeature.trim()];
                      setEditingProduct({ ...editingProduct, features });
                      setNewFeature('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded font-medium cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(editingProduct.features || []).map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs border border-slate-200"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const features = (editingProduct.features || []).filter(
                            (_, idx) => idx !== i
                          );
                          setEditingProduct({ ...editingProduct, features });
                        }}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block font-semibold text-slate-700">
                  Business Outcomes & Benefits ({editingProduct.benefits?.length || 0})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Add business outcome..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newBenefit.trim()) return;
                      const benefits = [...(editingProduct.benefits || []), newBenefit.trim()];
                      setEditingProduct({ ...editingProduct, benefits });
                      setNewBenefit('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded font-medium cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(editingProduct.benefits || []).map((b, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs border border-slate-200"
                    >
                      <span>{b}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const benefits = (editingProduct.benefits || []).filter(
                            (_, idx) => idx !== i
                          );
                          setEditingProduct({ ...editingProduct, benefits });
                        }}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isPublished ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isPublished: e.target.checked })
                    }
                    className="rounded text-[#35123F] focus:ring-[#35123F]"
                  />
                  <span>Publish Immediately to Public Catalog</span>
                </label>

                <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded font-medium cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-5 py-2 bg-[#35123F] hover:bg-[#24102D] text-white rounded font-bold uppercase tracking-wider cursor-pointer shadow-xs text-center"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        filter="image"
        title="Select Platform Hero Image"
        onSelect={(asset) => {
          if (editingProduct) {
            setEditingProduct({
              ...editingProduct,
              heroImage: asset.url,
              heroImageAlt: asset.altText || editingProduct.name,
            });
          }
          setShowMediaPicker(false);
          setFeedback('Platform image selected from Media Library');
          setTimeout(() => setFeedback(null), 2500);
        }}
      />
    </div>
  );
};
