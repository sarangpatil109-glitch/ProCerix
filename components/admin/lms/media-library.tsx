"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Search, Trash2, Copy, Image as ImageIcon, FileText, X, ExternalLink } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "pdf" | "icon" | "banner" | "thumbnail" | "other";
  size_bytes: number | null;
  mime_type: string | null;
  alt_text: string | null;
  folder: string | null;
  tags: string[] | null;
  created_at: string;
}

interface Props { initialMedia: MediaItem[] }

const TYPE_FILTERS = ["all", "image", "pdf", "icon", "banner", "thumbnail"] as const;
type TypeFilter = (typeof TYPE_FILTERS)[number];

function fmt(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaLibrary({ initialMedia }: Props) {
  const [items, setItems] = useState<MediaItem[]>(initialMedia);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [uploadForm, setUploadForm] = useState({ url: "", name: "", type: "image", alt_text: "" });
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((m) => {
    const matchType = typeFilter === "all" || m.type === typeFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || (m.alt_text || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleAddUrl = async () => {
    if (!uploadForm.url.trim()) { toast.error("URL required"); return; }
    setUploading(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_MEDIA", ...uploadForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((i) => [data, ...i]);
      setUploadForm({ url: "", name: "", type: "image", alt_text: "" });
      setShowUpload(false);
      toast.success("Added to media library");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "lms-media");
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      const type = file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "other";
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CREATE_MEDIA", url, name: file.name, type, size_bytes: file.size, mime_type: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((i) => [data, ...i]);
      toast.success("Uploaded!");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media item?")) return;
    try {
      await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_MEDIA", id }),
      });
      setItems((i) => i.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied!");
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Main panel */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {TYPE_FILTERS.map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${typeFilter === t ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/20">
            <Upload className="w-4 h-4" />Add Media
          </button>
        </div>

        {/* Upload modal */}
        {showUpload && (
          <div className="bg-white dark:bg-gray-900 border-2 border-blue-400 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Add Media</h3>
              <button onClick={() => setShowUpload(false)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            {/* File upload */}
            <div>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-blue-400 transition-colors">
                <Upload className="w-6 h-6 text-gray-400" />
                <p className="text-sm text-gray-500">{uploading ? "Uploading…" : "Click to upload file"}</p>
                <p className="text-xs text-gray-400">Images or PDFs</p>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400">or paste URL</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-gray-500">URL *</label>
                <input value={uploadForm.url} onChange={(e) => setUploadForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Name</label>
                <input value={uploadForm.name} onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="my-image.png" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Type</label>
                <select value={uploadForm.type} onChange={(e) => setUploadForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="image">Image</option>
                  <option value="pdf">PDF</option>
                  <option value="icon">Icon</option>
                  <option value="banner">Banner</option>
                  <option value="thumbnail">Thumbnail</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs text-gray-500">Alt Text</label>
                <input value={uploadForm.alt_text} onChange={(e) => setUploadForm((f) => ({ ...f, alt_text: e.target.value }))}
                  placeholder="Describe the image" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddUrl} disabled={uploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
                Add
              </button>
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300 dark:text-gray-700">
            <ImageIcon className="w-10 h-10 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{search ? "No results" : "No media yet. Add some above."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`group relative rounded-2xl border-2 overflow-hidden transition-all ${selected?.id === m.id ? "border-blue-500" : "border-gray-200 dark:border-gray-800 hover:border-blue-300"}`}
              >
                {m.type === "pdf" ? (
                  <div className="aspect-square bg-red-50 dark:bg-red-900/10 flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-red-400" />
                    <span className="text-xs font-bold text-red-500">PDF</span>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    <img src={m.url} alt={m.alt_text || m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3C/svg%3E"; }} />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{m.name || m.url.split("/").pop()}</p>
                  <p className="text-[10px] text-gray-400">{fmt(m.size_bytes)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-64 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-4 self-start sticky top-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Details</p>
            <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {selected.type === "pdf" ? (
            <div className="aspect-video bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-center">
              <FileText className="w-10 h-10 text-red-400" />
            </div>
          ) : (
            <img src={selected.url} alt={selected.alt_text || ""} className="w-full rounded-xl object-cover" />
          )}
          <div className="space-y-2 text-xs">
            <div><p className="text-gray-400">Name</p><p className="text-gray-800 dark:text-gray-200 font-medium break-all">{selected.name || "—"}</p></div>
            <div><p className="text-gray-400">Type</p><p className="text-gray-800 dark:text-gray-200 capitalize">{selected.type}</p></div>
            <div><p className="text-gray-400">Size</p><p className="text-gray-800 dark:text-gray-200">{fmt(selected.size_bytes)}</p></div>
            {selected.alt_text && <div><p className="text-gray-400">Alt Text</p><p className="text-gray-800 dark:text-gray-200">{selected.alt_text}</p></div>}
          </div>
          <div className="space-y-2">
            <button onClick={() => copyUrl(selected.url)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
              <Copy className="w-3.5 h-3.5" />Copy URL
            </button>
            <a href={selected.url} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />Open
            </a>
            <button onClick={() => handleDelete(selected.id)}
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
