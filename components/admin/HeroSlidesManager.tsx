'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload, Trash2, GripVertical, Loader2, Eye, EyeOff, Plus, ImageIcon
} from 'lucide-react';

interface HeroSlide {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  initialSlides: HeroSlide[];
}

export function HeroSlidesManager({ initialSlides }: Props) {
  const [slides, setSlides] = useState<HeroSlide[]>(
    [...initialSlides].sort((a, b) => a.sort_order - b.sort_order)
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Upload new slides ──────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    let added = 0;
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/admin/hero-slides', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success) {
          setSlides(prev => [...prev, json.data]);
          added++;
        } else {
          showToast(`Failed: ${json.error}`, 'error');
        }
      } catch {
        showToast('Upload failed', 'error');
      }
    }
    if (added > 0) showToast(`${added} slide${added > 1 ? 's' : ''} uploaded!`);
    if (fileRef.current) fileRef.current.value = '';
    setUploading(false);
  };

  // ── Delete slide ───────────────────────────────────────────
  const handleDelete = async (slide: HeroSlide) => {
    if (!confirm(`Delete this slide?`)) return;
    const res = await fetch(`/api/admin/hero-slides/${slide.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      setSlides(prev => prev.filter(s => s.id !== slide.id));
      showToast('Slide deleted');
    } else {
      showToast(json.error, 'error');
    }
  };

  // ── Toggle active ──────────────────────────────────────────
  const handleToggleActive = async (slide: HeroSlide) => {
    const next = !slide.is_active;
    const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    });
    const json = await res.json();
    if (json.success) {
      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, is_active: next } : s));
    } else {
      showToast(json.error, 'error');
    }
  };

  // ── Drag-to-reorder ────────────────────────────────────────
  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setDragOverIdx(i);
  };
  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null); setDragOverIdx(null); return;
    }
    const reordered = [...slides];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    // Reassign sort_order
    const updated = reordered.map((s, i) => ({ ...s, sort_order: i }));
    setSlides(updated);
    setDragIdx(null); setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // ── Save order ─────────────────────────────────────────────
  const handleSaveOrder = async () => {
    setSaving(true);
    const payload = slides.map((s, i) => ({ id: s.id, sort_order: i }));
    const res = await fetch('/api/admin/hero-slides', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides: payload }),
    });
    const json = await res.json();
    setSaving(false);
    showToast(json.success ? 'Order saved! Homepage updated.' : json.error, json.success ? 'success' : 'error');
  };

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-sage-dark" />
          <h2 className="font-medium text-charcoal">Hero Slider</h2>
          <span className="text-xs text-charcoal-lighter bg-sage-50 px-2 py-0.5 rounded-full">
            {slides.length} slide{slides.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveOrder}
            disabled={saving || slides.length === 0}
            className="btn-primary text-sm flex items-center gap-1.5 py-1.5 px-3"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Order'}
          </button>
          <label className="btn-secondary text-sm flex items-center gap-1.5 py-1.5 px-3 cursor-pointer">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading…' : 'Add Slides'}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <p className="text-xs text-charcoal-lighter -mt-1">
        Drag slides to reorder • Toggle eye to show/hide • Click trash to delete • Recommended size: 1920×900px
      </p>

      {/* Slides grid */}
      {slides.length === 0 ? (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-sage-light/40 rounded-xl py-16 cursor-pointer hover:border-sage-dark/40 transition-colors group">
          <Upload className="w-10 h-10 text-sage-light group-hover:text-sage-dark transition-colors mb-3" />
          <p className="text-sm font-medium text-charcoal-lighter">No slides yet — click to upload</p>
          <p className="text-xs text-charcoal-lighter/60 mt-1">JPG, PNG, WebP • Recommended 1920×900px</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                dragOverIdx === i && dragIdx !== i
                  ? 'border-sage-dark bg-sage-50 scale-[1.01]'
                  : dragIdx === i
                    ? 'border-sage-dark/50 opacity-50 bg-sage-50/50'
                    : 'border-sage-light/30 bg-white hover:border-sage-light/60'
              }`}
            >
              {/* Drag handle */}
              <div className="text-charcoal-lighter/40 hover:text-charcoal-lighter shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Order badge */}
              <div className="w-6 h-6 rounded-full bg-sage-50 flex items-center justify-center text-xs font-bold text-charcoal-lighter shrink-0">
                {i + 1}
              </div>

              {/* Thumbnail */}
              <div className="relative w-32 h-16 rounded-lg overflow-hidden bg-sage-50 shrink-0 border border-sage-light/20">
                <Image
                  src={slide.image_url}
                  alt={slide.title ?? `Slide ${i + 1}`}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
                {!slide.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <EyeOff className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-charcoal truncate">
                  {slide.title ?? <span className="text-charcoal-lighter italic">No title</span>}
                </p>
                <p className="text-xs text-charcoal-lighter truncate mt-0.5">
                  {slide.subtitle ?? slide.image_url.split('/').pop()}
                </p>
                {slide.link_url && (
                  <p className="text-xs text-sage-dark truncate mt-0.5">
                    🔗 {slide.link_url}
                  </p>
                )}
              </div>

              {/* Status badge */}
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                slide.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {slide.is_active ? 'Active' : 'Hidden'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleToggleActive(slide)}
                  title={slide.is_active ? 'Hide slide' : 'Show slide'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-sage-50 text-charcoal-lighter hover:text-charcoal transition-colors"
                >
                  {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(slide)}
                  title="Delete slide"
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-charcoal-lighter hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === 'success'
            ? 'bg-sage-dark text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
