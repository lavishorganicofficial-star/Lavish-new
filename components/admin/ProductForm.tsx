/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, X, Loader2, Star } from "lucide-react";
import { useToast } from "@/store/uiStore";

interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
  cloudinary_id?: string;
}

export function ProductForm({ categories, initialData }: { categories: any[]; initialData?: any }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [primaryPreviewIndex, setPrimaryPreviewIndex] = useState<number>(0);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [existingImages, setExistingImages] = useState<ProductImage[]>(
    (initialData?.images ?? []).sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order)
  );
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(selected);
    setPrimaryPreviewIndex(0); // Default to the first selected file
    // Revoke old previews first
    previews.forEach((url) => URL.revokeObjectURL(url));
    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  };

  const handleDeleteImage = async (image: ProductImage) => {
    if (!initialData?.id) return;
    try {
      const res = await fetch(
        `/api/admin/products/${initialData.id}/images?imageId=${image.id}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Delete failed");
      setExistingImages((prev) => prev.filter((img) => img.id !== image.id));
      toast.success("Image removed", "");
    } catch (err: any) {
      toast.error("Delete failed", err.message);
    }
  };

  const handleSetPrimary = async (image: ProductImage) => {
    if (!initialData?.id) return;
    try {
      const res = await fetch(
        `/api/admin/products/${initialData.id}/images?imageId=${image.id}`,
        { method: "PATCH" }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to set primary");
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === image.id }))
      );
      toast.success("Primary image updated", "");
    } catch (err: any) {
      toast.error("Failed to set primary", err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const productData = {
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        short_description: (formData.get("short_description") as string) || null,
        description: (formData.get("description") as string) || null,
        price: parseFloat(formData.get("price") as string),
        compare_price: formData.get("compare_price") ? parseFloat(formData.get("compare_price") as string) : null,
        cost_price: formData.get("cost_price") ? parseFloat(formData.get("cost_price") as string) : null,
        stock_quantity: parseInt(formData.get("stock_quantity") as string, 10),
        low_stock_threshold: formData.get("low_stock_threshold") ? parseInt(formData.get("low_stock_threshold") as string, 10) : 10,
        sku: (formData.get("sku") as string) || null,
        category_id: (formData.get("category_id") as string) || null,
        gst_rate: parseInt(formData.get("gst_rate") as string, 10),
        is_active: formData.get("is_active") === "on",
        is_featured: formData.get("is_featured") === "on",
      };

      let productId: string;

      if (initialData?.id) {
        // Update via server-side API route (bypasses RLS)
        const res = await fetch(`/api/admin/products/${initialData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to update product");
        productId = initialData.id;
      } else {
        // Create via server-side API route (bypasses RLS)
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Failed to create product");
        productId = json.data.id;
      }

      // Upload images via server-side API route (handles Cloudinary + DB insert + cache revalidation)
      if (files.length > 0) {
        setUploadingImages(true);
        const imgForm = new FormData();
        for (const file of files) {
          imgForm.append("file", file);
        }
        imgForm.append("primary_index", primaryPreviewIndex.toString());
        const uploadRes = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          body: imgForm,
        });
        const uploadJson = await uploadRes.json();
        setUploadingImages(false);
        if (!uploadJson.success) {
          // Product was saved but images failed — show warning, not error
          toast.error("Product saved but image upload failed", uploadJson.error ?? "Try uploading images again");
          router.push("/admin/products");
          router.refresh();
          return;
        }
      }

      toast.success(
        `Product ${initialData?.id ? "updated" : "created"}`,
        `Product ${initialData?.id ? "saved" : "added"} successfully`
      );
      router.push("/admin/products");
      router.refresh();
    } catch (err: any) {
      setUploadingImages(false);
      toast.error(`Failed to ${initialData?.id ? "update" : "create"} product`, err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-charcoal">Basic Information</h2>
        <div>
          <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Product Name *</label>
          <input 
            name="name" 
            required 
            defaultValue={initialData?.name} 
            onChange={(e) => {
              setSlug(slugify(e.target.value));
            }}
            className="input w-full" 
            placeholder="e.g. Rose Glow Vitamin C Face Serum" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">URL Slug *</label>
          <input 
            name="slug" 
            required 
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="input w-full font-mono" 
            placeholder="rose-glow-vitamin-c-face-serum" 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Short Description</label>
          <textarea name="short_description" defaultValue={initialData?.short_description} rows={2} className="input w-full resize-none" placeholder="Brief product summary shown in cards..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Full Description</label>
          <textarea name="description" defaultValue={initialData?.description} rows={6} className="input w-full resize-none" placeholder="Full product description, benefits, usage..." />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-charcoal">Pricing &amp; Inventory</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Selling Price (₹) *</label>
            <input name="price" type="number" required min="0" step="0.01" defaultValue={initialData?.price} className="input w-full" placeholder="599" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Compare Price (₹)</label>
            <input name="compare_price" type="number" min="0" step="0.01" defaultValue={initialData?.compare_price ?? ""} className="input w-full" placeholder="799 (strikethrough price)" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Cost Price (₹)</label>
            <input name="cost_price" type="number" min="0" step="0.01" defaultValue={initialData?.cost_price ?? ""} className="input w-full" placeholder="200 (not shown to customers)" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Stock Quantity *</label>
            <input name="stock_quantity" type="number" required min="0" defaultValue={initialData?.stock_quantity ?? 100} className="input w-full" placeholder="100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Low Stock Alert Below</label>
            <input name="low_stock_threshold" type="number" min="0" defaultValue={initialData?.low_stock_threshold ?? 10} className="input w-full" placeholder="10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">SKU</label>
            <input name="sku" defaultValue={initialData?.sku ?? ""} className="input w-full font-mono" placeholder="LO-FACE-001" />
          </div>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-charcoal">Category &amp; Visibility</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">Category</label>
            <select name="category_id" defaultValue={initialData?.category_id ?? ""} className="input w-full">
              <option value="">— Select Category —</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5">GST Rate (%)</label>
            <select name="gst_rate" defaultValue={initialData?.gst_rate ?? "18"} className="input w-full">
              <option value="18">18% (Standard)</option>
              <option value="12">12%</option>
              <option value="5">5%</option>
              <option value="0">0% (Exempt)</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          {[
            { name: "is_active", label: "Active (visible in store)", defaultChecked: initialData ? initialData.is_active : true },
            { name: "is_featured", label: "Featured (show on homepage)", defaultChecked: initialData?.is_featured ?? false },
          ].map((flag) => (
            <label key={flag.name} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name={flag.name} defaultChecked={flag.defaultChecked} className="w-4 h-4 accent-sage-dark" />
              <span className="text-sm text-charcoal">{flag.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Images */}
      <div className="card p-6 space-y-4">
        <h2 className="font-medium text-charcoal">Product Images</h2>

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-xs font-medium text-charcoal-lighter mb-2">
              Current Images <span className="text-sage-dark">({existingImages.length})</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {existingImages.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden bg-sage-50 border border-sage-light/30">
                  <Image src={img.url} alt="Product image" fill sizes="160px" className="object-cover" />
                  {img.is_primary && (
                    <div className="absolute top-1 left-1 bg-sage-dark text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> Primary
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!img.is_primary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img)}
                        title="Set as primary"
                        className="w-7 h-7 bg-sage-dark text-white rounded-full flex items-center justify-center hover:bg-sage-600"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img)}
                      title="Delete image"
                      className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New image previews */}
        {previews.length > 0 && (
          <div>
            <p className="text-xs font-medium text-charcoal-lighter mb-2">
              To be uploaded <span className="text-sage-dark">({previews.length} file{previews.length > 1 ? "s" : ""})</span>
              <span className="ml-2 text-charcoal-lighter/60">— these will upload when you click &quot;{initialData ? "Update" : "Create"} Product&quot;</span>
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {previews.map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-sage-50 border-2 border-dashed border-sage-dark/40">
                  <Image src={url} alt={`Preview ${i + 1}`} fill sizes="160px" className="object-cover opacity-80" />
                  
                  {i === primaryPreviewIndex && (
                    <div className="absolute top-1 left-1 bg-sage-dark text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> Cover
                    </div>
                  )}

                  <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center gap-2 ${i === primaryPreviewIndex ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {i !== primaryPreviewIndex && (
                      <button
                        type="button"
                        onClick={() => setPrimaryPreviewIndex(i)}
                        title="Set as cover image"
                        className="w-7 h-7 bg-sage-dark text-white rounded-full flex items-center justify-center hover:bg-sage-600 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload area */}
        <div className="border-2 border-dashed border-sage-light/40 rounded-xl p-6 text-center">
          <Upload className="w-8 h-8 text-sage-light mx-auto mb-2" />
          <p className="text-sm text-charcoal-lighter mb-1">Upload product images (JPG, PNG, WebP — max 5MB each)</p>
          <p className="text-xs text-charcoal-lighter mb-4">You can select the Cover Image by clicking the star icon on the previews above.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            id="product-images"
            onChange={handleFileChange}
          />
          <label htmlFor="product-images" className="btn-secondary cursor-pointer inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Browse Images
          </label>
          {files.length > 0 && (
            <button
              type="button"
              className="ml-3 text-xs text-red-400 hover:text-red-600 underline"
              onClick={() => {
                setFiles([]);
                previews.forEach((url) => URL.revokeObjectURL(url));
                setPreviews([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Clear selection
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading || uploadingImages} className="btn-primary flex items-center gap-2">
          {(loading || uploadingImages) && <Loader2 className="w-4 h-4 animate-spin" />}
          {uploadingImages
            ? `Uploading ${files.length} image${files.length > 1 ? "s" : ""}…`
            : loading
              ? "Saving…"
              : initialData
                ? "Update Product"
                : "Create Product"}
        </button>
        <Link href="/admin/products" className="btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
