"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Upload, Search, Trash2, Copy, Image as ImageIcon, FileText,
  X, ExternalLink, RefreshCw, Filter, LayoutGrid, List,
} from "lucide-react";

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

function fmtBytes(bytes: number | null) {
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
  const [replacing, setReplacing] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadForm, setUploadForm] = useState({ url: "", name: "", type: "image", alt_text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((m) => {
    const matchType = typeFilter === "all" || m.type === typeFilter;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.alt_text || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
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

  // Replace: upload new file and update the existing media record's URL
  const handleReplaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacing) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "lms-media");
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      // Update the existing media record
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_MEDIA",
          id: replacing,
          url,
          size_bytes: file.size,
          mime_type: file.type,
          name: file.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((i) => i.map((m) => (m.id === replacing ? data : m)));
      if (selected?.id === replacing) setSelected(data);
      toast.success("File replaced!");
    } catch (e: any) { toast.error(e.message); }
    finally {
      setUploading(false);
      setReplacing(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const startReplace = (id: string) => {
    setReplacing(id);
    replaceInputRef.current?.click();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this media item permanently?")) return;
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

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success("URL copied!"); };

  // Stats
  const totalSize = items.reduce((a, m) => a + (m.size_bytes || 0), 0);

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
      <input ref={replaceInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReplaceUpload} />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Files", value: items.length },
          { label: "Images", value: items.filter((m) => m.type === "image" || m.type === "banner" || m.type === "thumbnail" || m.type === "icon").length },
          { label: "Total Size", value: fmtBytes(totalSize) },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 text-center">
            <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, alt text, tag…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {TYPE_FILTERS.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${typeFilter === t ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/20">
          <Upload className="w-4 h-4" />Add Media
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="bg-white dark:bg-gray-900 border-2 border-blue-400 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Add Media</h3>
            <button onClick={() => setShowUpload(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>
          {/* File upload zone */}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
            <Upload className="w-6 h-6 text-gray-400" />
            <p className="text-sm text-gray-500 font-semibold">{uploading ? "Uploading…" : "Click to upload from device"}</p>
            <p className="text-xs text-gray-400">Images (PNG, JPG, SVG, WebP) or PDF</p>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-gray-400 font-medium">OR paste a URL</span>
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
                placeholder="Describe the image for accessibility" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddUrl} disabled={uploading || !uploadForm.url}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60">
              Add by URL
            </button>
            <button onClick={() => setShowUpload(false)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-4">
        {/* Media grid / list */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
              <ImageIcon className="w-10 h-10 mx-auto text-gray-200 dark:text-gray-700 mb-3" />
              <p className="text-sm text-gray-400">{search || typeFilter !== "all" ? "No results match the filter" : "No media yet. Upload files or add a URL."}</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((m) => (
                <button key={m.id} onClick={() => setSelected(m === selected ? null : m)}
                  className={`group relative rounded-2xl border-2 overflow-hidden transition-all text-left ${selected?.id === m.id ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900" : "border-gray-200 dark:border-gray-800 hover:border-blue-300"}`}>
                  {m.type === "pdf" ? (
                    <div className="aspect-square bg-red-50 dark:bg-red-900/10 flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-red-400" />
                      <span className="text-xs font-bold text-red-500">PDF</span>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden">
                      <img src={m.url} alt={m.alt_text || m.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">{m.name || m.url.split("/").pop()}</p>
                    <p className="text-[10px] text-gray-400">{fmtBytes(m.size_bytes)} · {m.type}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="grid grid-cols-12 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="col-span-5 text-xs font-bold text-gray-400 uppercase">Name</div>
                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase">Type</div>
                <div className="col-span-2 text-xs font-bold text-gray-400 uppercase">Size</div>
                <div className="col-span-3 text-xs font-bold text-gray-400 uppercase text-right">Actions</div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((m) => (
                  <div key={m.id} onClick={() => setSelected(m === selected ? null : m)}
                    className={`grid grid-cols-12 px-4 py-3 items-center cursor-pointer transition-colors ${selected?.id === m.id ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`}>
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {m.type === "pdf"
                        ? <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/10 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-red-400" /></div>
                        : <img src={m.url} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-gray-100" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{m.name || m.url.split("/").pop()}</p>
                    </div>
                    <div className="col-span-2"><span className="text-xs text-gray-500 capitalize">{m.type}</span></div>
                    <div className="col-span-2"><span className="text-xs text-gray-400">{fmtBytes(m.size_bytes)}</span></div>
                    <div className="col-span-3 flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => copyUrl(m.url)} title="Copy URL" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                      <button onClick={() => startReplace(m.id)} title="Replace file" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-amber-600 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(m.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-60 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-4 self-start sticky top-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Details</p>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-gray-400" /></button>
            </div>

            {selected.type === "pdf" ? (
              <div className="aspect-video bg-red-50 dark:bg-red-900/10 rounded-xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-red-400" />
              </div>
            ) : (
              <img src={selected.url} alt={selected.alt_text || ""}
                className="w-full rounded-xl object-cover max-h-36"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}

            <div className="space-y-2 text-xs">
              <div><p className="text-gray-400">Name</p><p className="text-gray-800 dark:text-gray-200 font-medium break-all">{selected.name || "—"}</p></div>
              <div><p className="text-gray-400">Type</p><p className="text-gray-800 dark:text-gray-200 capitalize">{selected.type}</p></div>
              <div><p className="text-gray-400">Size</p><p className="text-gray-800 dark:text-gray-200">{fmtBytes(selected.size_bytes)}</p></div>
              {selected.alt_text && <div><p className="text-gray-400">Alt Text</p><p className="text-gray-800 dark:text-gray-200">{selected.alt_text}</p></div>}
              <div><p className="text-gray-400">URL</p><p className="text-blue-600 text-[10px] break-all line-clamp-2">{selected.url}</p></div>
            </div>

            <div className="space-y-2">
              <button onClick={() => copyUrl(selected.url)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                <Copy className="w-3.5 h-3.5" />Copy URL
              </button>
              <button onClick={() => startReplace(selected.id)} disabled={uploading}
                className="w-full flex items-center justify-center gap-2 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-60">
                <RefreshCw className="w-3.5 h-3.5" />{uploading && replacing === selected.id ? "Replacing…" : "Replace File"}
              </button>
              <a href={selected.url} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />Open Original
              </a>
              <button onClick={() => handleDelete(selected.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-center text-gray-400">
        {filtered.length} of {items.length} files shown
      </p>
    </div>
  );
}
