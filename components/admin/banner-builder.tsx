"use client";

import { useState } from "react";
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Edit2, CheckCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface BannerItemProps {
  banner: any;
  onEdit: (banner: any) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
}

function SortableBannerCard({ banner, onEdit, onDelete, onTogglePublish }: BannerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-xl p-4 flex gap-4 group hover:border-gray-300 dark:hover:border-gray-700 transition-colors shadow-sm">
      <div {...attributes} {...listeners} className="cursor-grab pt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <GripVertical className="w-5 h-5" />
      </div>
      
      {/* Visual Preview */}
      <div className="w-48 h-24 bg-gray-100 dark:bg-[#1C1C1C] rounded-lg overflow-hidden relative shrink-0 border border-gray-200 dark:border-gray-800">
        {banner.image_url ? (
          <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 flex-col gap-1">
            <ImageIcon className="w-5 h-5" />
            <span className="text-[10px] uppercase font-semibold">No Image</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="font-bold text-gray-900 dark:text-white">{banner.title}</h4>
            {banner.is_published ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 uppercase tracking-wider">Published</span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 uppercase tracking-wider">Draft</span>
            )}
          </div>
          {banner.subtitle && <p className="text-sm text-gray-500 mt-1">{banner.subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => onEdit(banner)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3C] transition-colors flex items-center gap-1.5">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => onTogglePublish(banner.id, !banner.is_published)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${banner.is_published ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40' : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'}`}>
            <CheckCircle className="w-3.5 h-3.5" /> {banner.is_published ? 'Unpublish' : 'Publish'}
          </button>
          <button onClick={() => onDelete(banner.id)} className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function BannerBuilder({ initialBanners }: { initialBanners: any[] }) {
  const [banners, setBanners] = useState(initialBanners.sort((a, b) => (a.priority || 0) - (b.priority || 0)));
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const executeCrud = async (action: string, id?: string, payload?: any) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "banners", action, id, payload, primaryKey: "id" })
    });
    if (!res.ok) {
       const err = await res.json();
       throw new Error(err.error);
    }
    return res.json();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newArr = arrayMove(items, oldIndex, newIndex);
        
        // Optimistic update of priorities in DB
        updatePriorities(newArr);
        
        return newArr;
      });
    }
  };

  const updatePriorities = async (sortedBanners: any[]) => {
    const toastId = toast.loading("Saving new order...");
    try {
      await Promise.all(sortedBanners.map((b, idx) => 
        executeCrud("UPDATE", b.id, { priority: idx })
      ));
      toast.success("Order saved!", { id: toastId });
    } catch (error) {
      toast.error("Failed to save order", { id: toastId });
    }
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    const toastId = toast.loading(published ? "Publishing..." : "Unpublishing...");
    try {
      await executeCrud("UPDATE", id, { is_published: published });
      setBanners(prev => prev.map(b => b.id === id ? { ...b, is_published: published } : b));
      toast.success(published ? "Published!" : "Unpublished!", { id: toastId });
    } catch (error) {
      toast.error("Failed to update status", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      await executeCrud("DELETE", id);
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success("Deleted successfully", { id: toastId });
    } catch (error) {
      toast.error("Failed to delete", { id: toastId });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Saving...");
    try {
      if (editingBanner.id) {
        const data = await executeCrud("UPDATE", editingBanner.id, editingBanner);
        setBanners(prev => prev.map(b => b.id === data.id ? data : b));
      } else {
        const payload = { ...editingBanner, priority: banners.length };
        const data = await executeCrud("CREATE", undefined, payload);
        setBanners([...banners, data]);
      }
      toast.success("Saved successfully!", { id: toastId });
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error("Failed to save", { id: toastId });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Banner Builder</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Drag and drop to reorder promotional banners.</p>
        </div>
        <button 
          onClick={() => { setEditingBanner({ title: "", is_published: false }); setIsDrawerOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Banner
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {banners.map(banner => (
              <SortableBannerCard 
                key={banner.id} 
                banner={banner} 
                onEdit={(b) => { setEditingBanner(b); setIsDrawerOpen(true); }}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
            {banners.length === 0 && (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">No banners yet</h3>
                <p className="text-xs text-gray-500 mt-1">Create your first promotional banner.</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[#0E0E0E] shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800/60 animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800/60">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editingBanner?.id ? 'Edit Banner' : 'New Banner'}</h2>
            </div>
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title *</label>
                  <input required value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtitle</label>
                  <input value={editingBanner.subtitle || ''} onChange={e => setEditingBanner({...editingBanner, subtitle: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Button Text</label>
                  <input value={editingBanner.button_text || ''} onChange={e => setEditingBanner({...editingBanner, button_text: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Link URL</label>
                  <input value={editingBanner.link_url || ''} onChange={e => setEditingBanner({...editingBanner, link_url: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="https://" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Image URL</label>
                  <input value={editingBanner.image_url || ''} onChange={e => setEditingBanner({...editingBanner, image_url: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="https://" />
                  {editingBanner.image_url && (
                    <div className="mt-2 w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <img src={editingBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editingBanner.is_published} onChange={e => setEditingBanner({...editingBanner, is_published: e.target.checked})} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Publish immediately</span>
                  </label>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#161616] flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {loading ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
