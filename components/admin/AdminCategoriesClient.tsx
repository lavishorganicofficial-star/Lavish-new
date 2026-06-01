'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Tags, Plus, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Upload, X, Loader2, Save } from 'lucide-react';
import { ImageCropper } from './ImageCropper';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  meta_title: string;
  meta_description: string;
}

interface CategoryFormProps {
  initial?: Partial<Category>;
  onSave: (data: Partial<Category>) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function slugify(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function CategoryForm({ initial, onSave, onClose, saving }: CategoryFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.hero_image_url ?? '');
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [metaTitle, setMetaTitle] = useState(initial?.meta_title ?? '');
  const [metaDesc, setMetaDesc] = useState(initial?.meta_description ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState('');
  
  // Cropper states
  const [cropTarget, setCropTarget] = useState<'image' | 'hero' | null>(null);
  const [cropSrc, setCropSrc] = useState<string>('');

  const fileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!initial?.slug) setSlug(slugify(v));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'hero') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropTarget(target);
    if (target === 'image' && fileRef.current) fileRef.current.value = '';
    if (target === 'hero' && heroFileRef.current) heroFileRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const target = cropTarget;
    setCropTarget(null);
    setCropSrc('');
    
    if (target === 'image') {
      setUploading(true);
      setUploadError('');
    } else {
      setHeroUploading(true);
      setHeroUploadError('');
    }
    
    try {
      const fd = new FormData();
      fd.append('file', croppedBlob, `cropped-${Date.now()}.jpg`);
      
      const res = await fetch('/api/admin/categories/upload-image', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Upload failed');
      
      if (target === 'image') {
        setImageUrl(json.data.url);
        if (initial?.id) {
          await fetch(`/api/admin/categories/${initial.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image_url: json.data.url }),
          });
        }
      } else {
        setHeroImageUrl(json.data.url);
        if (initial?.id) {
          await fetch(`/api/admin/categories/${initial.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hero_image_url: json.data.url }),
          });
        }
      }
    } catch (err: unknown) {
      if (target === 'image') setUploadError(err instanceof Error ? err.message : 'Upload failed');
      else setHeroUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (target === 'image') setUploading(false);
      else setHeroUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name, slug, description,
      image_url: imageUrl || null,
      hero_image_url: heroImageUrl || null,
      is_active: isActive,
      meta_title: metaTitle,
      meta_description: metaDesc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage-light/20">
          <h2 className="font-display text-lg font-medium text-charcoal">
            {initial?.id ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Category Image</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-sage-50 border-2 border-dashed border-sage-light flex-shrink-0 flex items-center justify-center relative">
                  {imageUrl ? (
                    <>
                      <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-2xl">🌿</span>
                  )}
                </div>
                <div className="flex-1">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'image')} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary text-sm flex items-center gap-2 mb-1"
                  >
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading…' : 'Upload Image'}
                  </button>
                  <p className="text-xs text-charcoal-lighter">JPG, PNG or WebP · Max 5MB</p>
                  {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                </div>
              </div>
            </div>

            {/* Hero Banner Image upload */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">Hero Banner Image</label>
              <div className="flex flex-col gap-4">
                {heroImageUrl ? (
                  <div className="w-full aspect-[21/9] sm:aspect-[3/1] rounded-xl overflow-hidden bg-sage-50 border-2 border-dashed border-sage-light relative">
                    <Image src={heroImageUrl} alt="Hero Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setHeroImageUrl('')}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-sage-50 border-2 border-dashed border-sage-light flex items-center justify-center">
                    <span className="text-sm text-sage-dark/50">No hero banner (optional)</span>
                  </div>
                )}
                <div>
                  <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e, 'hero')} />
                  <button
                    type="button"
                    onClick={() => heroFileRef.current?.click()}
                    disabled={heroUploading}
                    className="btn-secondary text-sm flex items-center gap-2 mb-1"
                  >
                    {heroUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {heroUploading ? 'Uploading Banner…' : 'Upload Banner'}
                  </button>
                  <p className="text-xs text-charcoal-lighter">JPG, PNG or WebP · Recommended: 1920x600px</p>
                  {heroUploadError && <p className="text-xs text-red-500 mt-1">{heroUploadError}</p>}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Name *</label>
              <input
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input w-full"
                placeholder="e.g. Face Care"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Slug *</label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-lighter bg-sage-50 px-3 py-2 rounded border border-sage-light/30">/category/</span>
                <input
                  required
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="input flex-1"
                  placeholder="face-care"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input w-full resize-none"
                placeholder="Short description for the category page…"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-charcoal">Visible on store</p>
                <p className="text-xs text-charcoal-lighter">Show this category on the homepage and navigation</p>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-sage-dark' : 'bg-sage-light/30'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isActive ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* SEO accordion */}
            <details className="border border-sage-light/20 rounded-lg">
              <summary className="px-4 py-3 text-sm font-medium text-charcoal cursor-pointer select-none">SEO Settings (optional)</summary>
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-sage-light/20">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Meta Title</label>
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="input w-full text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">Meta Description</label>
                  <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={2} className="input w-full text-sm resize-none" />
                </div>
              </div>
            </details>
          </div>

          {/* Footer (Always visible) */}
          <div className="px-6 py-4 border-t border-sage-light/20 flex items-center justify-end gap-3 bg-white">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={saving || uploading || heroUploading}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
      
      {cropTarget && cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          aspectRatio={cropTarget === 'image' ? 1 : 1920/600}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropTarget(null);
            setCropSrc('');
          }}
        />
      )}
    </div>
  );
}

interface AdminCategoriesClientProps {
  initialCategories: Category[];
}

export function AdminCategoriesClient({ initialCategories }: AdminCategoriesClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [modalCategory, setModalCategory] = useState<Partial<Category> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => { setIsNew(true); setModalCategory({}); };
  const openEdit = (cat: Category) => { setIsNew(false); setModalCategory(cat); };
  const closeModal = () => setModalCategory(null);

  const handleSave = async (data: Partial<Category>) => {
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setCategories((prev) => [...prev, json.data]);
        showToast('Category created!');
      } else if (modalCategory?.id) {
        const res = await fetch(`/api/admin/categories/${modalCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setCategories((prev) =>
          prev.map((c) => (c.id === modalCategory.id ? { ...c, ...data } : c))
        );
        showToast('Category updated!');
      }
      closeModal();
      router.refresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed', false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: Category) => {
    const newActive = !cat.is_active;
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: newActive } : c));
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      showToast(`Category ${newActive ? 'enabled' : 'disabled'}`);
      router.refresh();
    } catch {
      // revert
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: cat.is_active } : c));
      showToast('Failed to update status', false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Category deleted');
    } catch {
      showToast('Delete failed', false);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.ok ? 'bg-sage-dark' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-charcoal">Categories</h1>
          <p className="text-sm text-charcoal-lighter mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2" id="add-category-btn">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-sage-light/10">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-4 p-4 hover:bg-sage-50/30 transition-colors">
              {/* Image */}
              <div className="w-14 h-14 bg-sage-50 rounded-xl overflow-hidden flex-shrink-0 relative">
                {category.image_url ? (
                  <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🌿</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal">{category.name}</p>
                <p className="text-xs text-charcoal-lighter truncate">/category/{category.slug}</p>
                {category.description && (
                  <p className="text-xs text-charcoal-lighter/70 truncate mt-0.5">{category.description}</p>
                )}
              </div>

              {/* Status toggle */}
              <button
                onClick={() => handleToggle(category)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  category.is_active ? 'bg-sage-50 text-sage-dark hover:bg-sage-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
                title={category.is_active ? 'Click to disable' : 'Click to enable'}
              >
                {category.is_active
                  ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                  : <><ToggleLeft className="w-3.5 h-3.5" /> Hidden</>
                }
              </button>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={`/category/${category.slug}`} target="_blank" rel="noreferrer" className="btn-icon" aria-label="View">
                  <Eye className="w-4 h-4" />
                </a>
                <button onClick={() => openEdit(category)} className="btn-icon" aria-label="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(category.id)}
                  className="btn-icon text-red-400 hover:text-red-600"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {!categories.length && (
            <div className="p-12 text-center">
              <Tags className="w-10 h-10 text-sage-light mx-auto mb-3" />
              <p className="text-charcoal-lighter text-sm">No categories yet.</p>
              <button onClick={openCreate} className="btn-primary mt-4">Add First Category</button>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Create Modal */}
      {modalCategory !== null && (
        <CategoryForm
          initial={modalCategory}
          onSave={handleSave}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-display text-lg font-medium text-charcoal mb-2">Delete Category?</h3>
            <p className="text-sm text-charcoal-lighter mb-6">
              This will permanently delete the category. Products in this category will become uncategorised.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
