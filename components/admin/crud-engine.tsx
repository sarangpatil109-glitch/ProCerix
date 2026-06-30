"use client";
import { useState, useMemo } from "react";
import { 
  Search, Plus, Edit2, Trash2, CheckCircle, XCircle, MoreVertical, 
  ChevronLeft, ChevronRight, X, Copy, Download, Filter 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type CRUDColumn = {
  key: string;
  title: string;
  type: "text" | "number" | "boolean" | "enum" | "richtext" | "image" | "tags";
  options?: string[];
};

export type CRUDConfig = {
  entityName: string;
  tableName: string;
  columns: CRUDColumn[];
  actions: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    duplicate?: boolean;
    publish?: boolean;
  };
  customEditRoute?: string;
  primaryKey?: string;
  bulkActions?: {
    publish?: boolean;
    feature?: boolean;
    delete?: boolean;
    bulkPrice?: boolean;
  };
};

export function GenericCRUDEngine({
  config,
  data
}: {
  config: CRUDConfig;
  data: any[];
}) {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);
  const [bulkPriceForm, setBulkPriceForm] = useState({ price: "", original_price: "" });
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();
  const pk = config.primaryKey || "id";

  const filteredData = useMemo(() => {
    return data.filter(item => 
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(currentData.map(item => item[pk])));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const openDrawer = (item?: any) => {
    if (item && config.customEditRoute) {
      router.push(`${config.customEditRoute}/${item[pk]}`);
      return;
    }
    setEditingItem(item || null);
    setFormData(item || {});
    setModalOpen(true);
  };

  const closeDrawer = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const executeCrud = async (action: string, id?: string, payload?: any, ids?: string[]) => {
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: config.tableName, action, id, payload, ids, primaryKey: pk })
    });
    if (!res.ok) {
       const err = await res.json();
       throw new Error(err.error);
    }
    return res.json();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(editingItem ? "Updating..." : "Creating...");
    try {
      if (editingItem) {
        await executeCrud("UPDATE", editingItem[pk], formData);
      } else {
        await executeCrud("CREATE", undefined, formData);
      }
      toast.success(editingItem ? "Updated successfully!" : "Created successfully!", { id: toastId });
      closeDrawer();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save", { id: toastId });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    const toastId = toast.loading("Deleting...");
    try {
      await executeCrud("DELETE", id);
      toast.success("Deleted successfully!", { id: toastId });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete", { id: toastId });
    }
    setLoading(false);
  };

  const handleDuplicate = async (id: string) => {
    setLoading(true);
    const toastId = toast.loading("Duplicating...");
    try {
      await executeCrud("DUPLICATE", id);
      toast.success("Duplicated successfully!", { id: toastId });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate", { id: toastId });
    }
    setLoading(false);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setLoading(true);
    const toastId = toast.loading(currentStatus ? "Unpublishing..." : "Publishing...");
    try {
      await executeCrud("UPDATE", id, { is_published: !currentStatus });
      toast.success(currentStatus ? "Unpublished successfully!" : "Published successfully!", { id: toastId });
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle status", { id: toastId });
    }
    setLoading(false);
  };

  const handleBulkAction = async (actionType: "publish" | "unpublish" | "feature" | "unfeature" | "delete") => {
    if (selectedIds.size === 0) return;
    if (actionType === "delete" && !confirm(`Delete ${selectedIds.size} items?`)) return;
    
    const toastId = toast.loading(`Executing bulk ${actionType}...`);
    try {
      const ids = Array.from(selectedIds);
      if (actionType === "delete") {
        await executeCrud("BULK_DELETE", undefined, undefined, ids);
      } else {
        let payload: any = {};
        if (actionType === "publish") payload = { is_published: true };
        if (actionType === "unpublish") payload = { is_published: false };
        if (actionType === "feature") payload = { is_featured: true };
        if (actionType === "unfeature") payload = { is_featured: false };
        await executeCrud("BULK_UPDATE", undefined, payload, ids);
      }
      toast.success(`Bulk ${actionType} successful!`, { id: toastId });
      setSelectedIds(new Set());
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Bulk action failed", { id: toastId });
    }
  };

  const handleBulkPriceApply = async (applyToAll: boolean) => {
    if (!applyToAll && selectedIds.size === 0) {
      toast.error("No items selected. Select rows first or use \"Apply to All\".");
      return;
    }
    if (applyToAll && !confirm(`Are you sure you want to apply this price to ALL ${config.entityName.toLowerCase()}s?`)) return;

    setLoading(true);
    const toastId = toast.loading("Updating prices...");

    try {
      const payload = {
        price: Number(bulkPriceForm.price),
        original_price: Number(bulkPriceForm.original_price)
      };

      const ids = applyToAll ? data.map(item => item[pk]) : Array.from(selectedIds);
      await executeCrud("BULK_UPDATE", undefined, payload, ids);

      toast.success("Prices updated successfully!", { id: toastId });
      setBulkPriceModalOpen(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update prices", { id: toastId });
    }
    setLoading(false);
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={`Search ${config.entityName}s...`}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#1C1C1C] text-sm border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
            />
          </div>
          <button className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] transition-colors shadow-sm text-gray-500">
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && config.bulkActions && (
            <div className="flex items-center gap-2 mr-4 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-xs font-medium text-gray-500">{selectedIds.size} selected</span>
              
              {config.bulkActions.publish && (
                <>
                  <button onClick={() => handleBulkAction("publish")} className="px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-md hover:bg-green-100 transition-colors">Publish</button>
                  <button onClick={() => handleBulkAction("unpublish")} className="px-3 py-1.5 text-xs font-semibold bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-100 transition-colors">Unpublish</button>
                </>
              )}
              {config.bulkActions.feature && (
                <button onClick={() => handleBulkAction("feature")} className="px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 rounded-md hover:bg-purple-100 transition-colors">Feature</button>
              )}
              {config.bulkActions.delete && (
                <button onClick={() => handleBulkAction("delete")} className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-md hover:bg-red-100 transition-colors">Delete</button>
              )}
            </div>
          )}

          {config.bulkActions?.bulkPrice && (
            <button onClick={() => setBulkPriceModalOpen(true)} className="px-3 py-1.5 text-xs font-semibold bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/50 rounded-md hover:bg-yellow-100 transition-colors">💰 Bulk Price</button>
          )}

          {config.actions.create && (
            <button 
              onClick={() => openDrawer()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-black text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> New {config.entityName}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F7F8] dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-gray-800/60 text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-transparent text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={currentData.length > 0 && selectedIds.size === currentData.length}
                    onChange={handleSelectAll}
                  />
                </th>
                {config.columns.map(col => (
                  <th key={col.key} className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
                    {col.title}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[11px] w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-gray-700 dark:text-gray-300">
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 2} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 opacity-20" />
                      <p>No {config.entityName.toLowerCase()}s found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map(item => (
                  <tr key={item[pk]} className="hover:bg-gray-50/50 dark:hover:bg-[#1C1C1C]/50 transition-colors group">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-transparent text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedIds.has(item[pk])}
                        onChange={() => handleSelectOne(item[pk])}
                      />
                    </td>
                    {config.columns.map(col => (
                      <td key={col.key} className="px-4 py-3 truncate max-w-[200px]">
                        {col.type === "boolean" ? (
                          item[col.key] 
                            ? <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Yes</span>
                            : <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>No</span>
                        ) : col.type === "richtext" ? (
                          <span className="text-gray-500 truncate block text-xs">{item[col.key]?.substring(0, 40) || '—'}</span>
                        ) : col.type === "image" ? (
                          item[col.key] ? (
                            <img src={item[col.key]} alt="" className="w-10 h-10 rounded-md object-cover border border-gray-200 dark:border-gray-800" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400">N/A</div>
                          )
                        ) : col.type === "tags" ? (
                           <div className="flex flex-wrap gap-1">
                             {(item[col.key] || []).slice(0,2).map((tag: string) => (
                               <span key={tag} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] whitespace-nowrap">{tag}</span>
                             ))}
                             {(item[col.key] || []).length > 2 && <span className="text-[10px] text-gray-500">+{item[col.key].length - 2}</span>}
                           </div>
                        ) : (
                          <span className="font-medium">{item[col.key] ?? '—'}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {config.actions.edit && (
                          <button onClick={() => openDrawer(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {config.actions.duplicate && (
                          <button onClick={() => handleDuplicate(item[pk])} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        {config.actions.publish && typeof item.is_published === 'boolean' && (
                          <button onClick={() => handleTogglePublish(item[pk], item.is_published)} className={`p-1.5 text-gray-400 rounded-md transition-colors ${item.is_published ? 'hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`} title={item.is_published ? "Unpublish" : "Publish"}>
                            {item.is_published ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        )}
                        {config.actions.delete && (
                          <button onClick={() => handleDelete(item[pk])} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800/60 flex items-center justify-between bg-white dark:bg-[#161616]">
            <p className="text-xs text-gray-500">
              Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-md border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2C2C2C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium px-2 py-1">Page {page} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-md border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-[#2C2C2C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Edit Drawer */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={closeDrawer} />
          
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-[#0E0E0E] shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800/60 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800/60">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                {editingItem ? `Edit ${config.entityName}` : `Create ${config.entityName}`}
              </h2>
              <button onClick={closeDrawer} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {config.columns.map(col => (
                  <div key={col.key} className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {col.title}
                    </label>
                    
                    {col.type === "boolean" ? (
                      <select 
                        value={formData[col.key]?.toString() || "false"}
                        onChange={(e) => setFormData({...formData, [col.key]: e.target.value === "true"})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : col.type === "enum" && col.options ? (
                      <select 
                        value={formData[col.key] || col.options[0]}
                        onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 capitalize transition-shadow"
                      >
                        {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : col.type === "richtext" ? (
                      <textarea 
                        value={formData[col.key] || ""}
                        onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                        rows={8}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow resize-none"
                      />
                    ) : col.type === "image" ? (
                      <div className="space-y-2">
                        {formData[col.key] && <img src={formData[col.key]} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-800" />}
                        <input 
                          type="text"
                          placeholder="Image URL..."
                          value={formData[col.key] || ""}
                          onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                        />
                      </div>
                    ) : col.type === "tags" ? (
                      <input 
                        type="text"
                        placeholder="Comma separated tags..."
                        value={(formData[col.key] || []).join(", ")}
                        onChange={(e) => setFormData({...formData, [col.key]: e.target.value.split(",").map(s => s.trim()).filter(Boolean)})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                      />
                    ) : (
                      <input 
                        type={col.type === "number" ? "number" : "text"}
                        value={formData[col.key] || ""}
                        onChange={(e) => setFormData({...formData, [col.key]: col.type === "number" ? Number(e.target.value) : e.target.value})}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#161616] flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={closeDrawer}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Price Modal */}
      {bulkPriceModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden font-sans flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setBulkPriceModalOpen(false)} />
          <div className="relative bg-white dark:bg-[#0E0E0E] shadow-2xl rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-800/60 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800/60">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                {config.entityName === "Internship" ? "Bulk Internship Price Editor" : "Bulk Price Editor"}
              </h2>
              <button onClick={() => setBulkPriceModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Selling Price</label>
                <input 
                  type="number"
                  value={bulkPriceForm.price}
                  onChange={e => setBulkPriceForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="e.g. 99"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Original Price</label>
                <input 
                  type="number"
                  value={bulkPriceForm.original_price}
                  onChange={e => setBulkPriceForm(prev => ({ ...prev, original_price: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="e.g. 499"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-[#161616] flex flex-col gap-2 shrink-0 rounded-b-2xl">
              <button 
                onClick={() => handleBulkPriceApply(false)} 
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                Apply to Selected
              </button>
              <button 
                onClick={() => handleBulkPriceApply(true)} 
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {config.entityName === "Internship" ? "Apply to All Internships" : "Apply to All Courses"}
              </button>
              <button 
                onClick={() => setBulkPriceModalOpen(false)}
                className="w-full py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
