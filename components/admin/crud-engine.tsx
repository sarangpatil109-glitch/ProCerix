"use client";
import { useState } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export type CRUDColumn = {
  key: string;
  title: string;
  type: "text" | "number" | "boolean" | "enum" | "richtext";
  options?: string[]; // for enum
};

export type CRUDConfig = {
  entityName: string;
  tableName: string;
  columns: CRUDColumn[];
  actions: {
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  customEditRoute?: (id: string) => string;
  primaryKey?: string;
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
  const router = useRouter();

  const filteredData = data.filter(item => 
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (item?: any) => {
    const pk = config.primaryKey || "id";
    if (item && config.customEditRoute) {
      router.push(config.customEditRoute(item[pk]));
      return;
    }
    setEditingItem(item || null);
    setFormData(item || {});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const executeCrud = async (action: string, id?: string, payload?: any) => {
    const pk = config.primaryKey || "id";
    const res = await fetch("/api/admin/crud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: config.tableName, action, id, payload, primaryKey: pk })
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
    const pk = config.primaryKey || "id";
    try {
      if (editingItem) {
        await executeCrud("UPDATE", editingItem[pk], formData);
      } else {
        await executeCrud("CREATE", undefined, formData);
      }
      closeModal();
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to save.");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    try {
      await executeCrud("DELETE", id);
      window.location.reload();
    } catch (error) {
      alert("Failed to delete.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={`Search ${config.entityName}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {config.actions.create && (
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" /> Add {config.entityName}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                {config.columns.map(col => (
                  <th key={col.key} className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {col.title}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredData.map(item => {
                  const pk = config.primaryKey || "id";
                  return (
                  <tr key={item[pk]} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {config.columns.map(col => (
                      <td key={col.key} className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        {col.type === "boolean" ? (
                          item[col.key] ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-gray-400" />
                        ) : col.type === "richtext" ? (
                          <span className="truncate block max-w-xs">{item[col.key]?.substring(0, 50)}...</span>
                        ) : (
                          item[col.key]
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 flex items-center justify-end gap-2">
                      {config.actions.edit && (
                        <button onClick={() => openModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {config.actions.delete && (
                        <button onClick={() => handleDelete(item[config.primaryKey || "id"])} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? `Edit ${config.entityName}` : `New ${config.entityName}`}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {config.columns.map(col => (
                <div key={col.key} className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {col.title}
                  </label>
                  
                  {col.type === "boolean" ? (
                    <select 
                      value={formData[col.key]?.toString() || "false"}
                      onChange={(e) => setFormData({...formData, [col.key]: e.target.value === "true"})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : col.type === "enum" && col.options ? (
                    <select 
                      value={formData[col.key] || col.options[0]}
                      onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                    >
                      {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : col.type === "richtext" ? (
                    <textarea 
                      value={formData[col.key] || ""}
                      onChange={(e) => setFormData({...formData, [col.key]: e.target.value})}
                      rows={6}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <input 
                      type={col.type === "number" ? "number" : "text"}
                      value={formData[col.key] || ""}
                      onChange={(e) => setFormData({...formData, [col.key]: col.type === "number" ? Number(e.target.value) : e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
              
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
