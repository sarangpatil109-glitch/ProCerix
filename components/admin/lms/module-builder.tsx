"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Plus, Pencil, Trash2, Copy, ChevronDown, ChevronRight,
  FileText, BookOpen, Check, X,
} from "lucide-react";
import { ArticleEditor } from "./article-editor";

interface Lesson { id: string; title: string; content: string; sequence_order: number; estimated_reading_time: number; }
interface Module { id: string; title: string; description: string; sequence_order: number; lessons: Lesson[]; }

interface Props {
  courseId: string;
  modules: Module[];
  onChange: (mods: Module[]) => void;
}

function SortableLesson({
  lesson, moduleId, onEdit, onDelete, onDuplicate, onSelect, isSelected,
}: {
  lesson: Lesson; moduleId: string;
  onEdit: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSelect: (lesson: Lesson) => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-lg group transition-all ${
        isDragging ? "opacity-50 bg-blue-50 dark:bg-blue-900/20" : isSelected ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { onEdit(lesson.id, title); setEditing(false); } if (e.key === "Escape") { setTitle(lesson.title); setEditing(false); } }}
          className="flex-1 px-2 py-0.5 border border-blue-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-900"
        />
      ) : (
        <button
          onClick={() => onSelect(lesson)}
          className="flex-1 text-left text-xs text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 truncate"
        >
          {lesson.title}
        </button>
      )}
      {lesson.estimated_reading_time > 0 && (
        <span className="text-[10px] text-gray-400 shrink-0">{lesson.estimated_reading_time}m</span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {editing ? (
          <>
            <button onClick={() => { onEdit(lesson.id, title); setEditing(false); }} className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setTitle(lesson.title); setEditing(false); }} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-3.5 h-3.5" /></button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDuplicate(lesson.id)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (confirm("Delete this article?")) onDelete(lesson.id); }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </>
        )}
      </div>
    </div>
  );
}

function SortableModule({
  mod, onUpdate, onDelete, onDuplicate, onAddLesson,
  onEditLesson, onDeleteLesson, onDuplicateLesson, onLessonReorder,
  onSelectLesson, selectedLessonId,
}: {
  mod: Module;
  onUpdate: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lessonId: string, title: string) => void;
  onDeleteLesson: (lessonId: string, moduleId: string) => void;
  onDuplicateLesson: (lessonId: string, moduleId: string) => void;
  onLessonReorder: (moduleId: string, lessons: Lesson[]) => void;
  onSelectLesson: (lesson: Lesson) => void;
  selectedLessonId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mod.id });
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(mod.title);
  const [description, setDescription] = useState(mod.description || "");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = mod.lessons.findIndex((l) => l.id === active.id);
    const newIdx = mod.lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(mod.lessons, oldIdx, newIdx).map((l, i) => ({ ...l, sequence_order: i + 1 }));
    onLessonReorder(mod.id, reordered);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border transition-all ${isDragging ? "opacity-50 shadow-xl" : "border-gray-200 dark:border-gray-700"}`}
    >
      {/* Module header */}
      <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-t-2xl group">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 transition-colors">
          <GripVertical className="w-4 h-4" />
        </div>
        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {editing ? (
          <div className="flex-1 space-y-1.5">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setTitle(mod.title); setDescription(mod.description || ""); setEditing(false); } }}
              className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Module description (optional)"
              className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
            />
            <div className="flex gap-2 pt-1">
              <button onClick={() => { onUpdate(mod.id, title, description); setEditing(false); }} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"><Check className="w-3 h-3" />Save</button>
              <button onClick={() => { setTitle(mod.title); setDescription(mod.description || ""); setEditing(false); }} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{mod.title}</p>
            {mod.description && <p className="text-xs text-gray-500 truncate">{mod.description}</p>}
          </div>
        )}

        <span className="text-xs text-gray-400 shrink-0">{mod.lessons.length} articles</span>

        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDuplicate(mod.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={() => { if (confirm(`Delete module "${mod.title}" and all its articles?`)) onDelete(mod.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>

      {/* Lessons */}
      {open && (
        <div className="pb-3 px-3 bg-white dark:bg-gray-900 rounded-b-2xl space-y-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
            <SortableContext items={mod.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              {mod.lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  moduleId={mod.id}
                  isSelected={selectedLessonId === lesson.id}
                  onEdit={(id, t) => onEditLesson(id, t)}
                  onDelete={(id) => onDeleteLesson(id, mod.id)}
                  onDuplicate={(id) => onDuplicateLesson(id, mod.id)}
                  onSelect={onSelectLesson}
                />
              ))}
            </SortableContext>
          </DndContext>
          {mod.lessons.length === 0 && (
            <p className="text-xs text-gray-400 pl-10 py-2">No articles yet</p>
          )}
          <button
            onClick={() => onAddLesson(mod.id)}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold pl-10 py-1.5 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add Article
          </button>
        </div>
      )}
    </div>
  );
}

export function ModuleBuilder({ courseId, modules, onChange }: Props) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const api = async (action: string, extra: Record<string, unknown>) => {
    setLoading(action);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data;
    } catch (e: any) {
      toast.error(e.message);
      return null;
    } finally {
      setLoading(null);
    }
  };

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIdx, newIdx).map((m, i) => ({ ...m, sequence_order: i + 1 }));
    onChange(reordered);
    await api("REORDER_MODULES", { items: reordered.map((m) => ({ id: m.id, sequence_order: m.sequence_order })) });
  };

  const addModule = async () => {
    const title = `Module ${modules.length + 1}`;
    const data = await api("CREATE_MODULE", { courseId, title });
    if (data) onChange([...modules, { ...data, lessons: [] }]);
  };

  const updateModule = async (id: string, title: string, description: string) => {
    const data = await api("UPDATE_MODULE", { id, title, description });
    if (data) onChange(modules.map((m) => m.id === id ? { ...m, title, description } : m));
    toast.success("Saved");
  };

  const deleteModule = async (id: string) => {
    await api("DELETE_MODULE", { id });
    onChange(modules.filter((m) => m.id !== id));
    if (selectedLesson && modules.find((m) => m.id === id)?.lessons.some((l) => l.id === selectedLesson.id)) {
      setSelectedLesson(null);
    }
    toast.success("Module deleted");
  };

  const duplicateModule = async (id: string) => {
    const data = await api("DUPLICATE_MODULE", { id });
    if (data) onChange([...modules, { ...data, lessons: [] }]);
    toast.success("Duplicated");
  };

  const addLesson = async (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    const title = `Article ${(mod?.lessons.length || 0) + 1}`;
    const data = await api("CREATE_LESSON", { moduleId, title });
    if (data) {
      const updated = modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m
      );
      onChange(updated);
      setSelectedLesson(data);
    }
  };

  const editLesson = async (lessonId: string, title: string) => {
    const data = await api("UPDATE_LESSON", { id: lessonId, title });
    if (data) {
      onChange(modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, title } : l),
      })));
      if (selectedLesson?.id === lessonId) setSelectedLesson((s) => s ? { ...s, title } : s);
    }
    toast.success("Renamed");
  };

  const deleteLesson = async (lessonId: string, moduleId: string) => {
    await api("DELETE_LESSON", { id: lessonId });
    onChange(modules.map((m) =>
      m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
    ));
    if (selectedLesson?.id === lessonId) setSelectedLesson(null);
    toast.success("Deleted");
  };

  const duplicateLesson = async (lessonId: string, moduleId: string) => {
    const data = await api("DUPLICATE_LESSON", { id: lessonId });
    if (data) {
      onChange(modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, data] } : m
      ));
    }
    toast.success("Duplicated");
  };

  const handleLessonReorder = async (moduleId: string, lessons: Lesson[]) => {
    onChange(modules.map((m) => m.id === moduleId ? { ...m, lessons } : m));
    await api("REORDER_LESSONS", { items: lessons.map((l) => ({ id: l.id, sequence_order: l.sequence_order })) });
  };

  const handleLessonContentSave = (lessonId: string, content: string, readTime: number) => {
    onChange(modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, content, estimated_reading_time: readTime } : l),
    })));
    setSelectedLesson((s) => s?.id === lessonId ? { ...s, content, estimated_reading_time: readTime } : s);
  };

  const totalLessons = modules.reduce((a, m) => a + m.lessons.length, 0);

  return (
    <div className="flex gap-6 h-full" style={{ minHeight: "600px" }}>
      {/* Left: Module Tree */}
      <div className="w-80 shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Modules</h3>
            <p className="text-xs text-gray-400">{modules.length} modules · {totalLessons} articles</p>
          </div>
          <button
            onClick={addModule}
            disabled={!!loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
          >
            <Plus className="w-3.5 h-3.5" /> Module
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {modules.map((mod) => (
                <SortableModule
                  key={mod.id}
                  mod={mod}
                  selectedLessonId={selectedLesson?.id || null}
                  onUpdate={updateModule}
                  onDelete={deleteModule}
                  onDuplicate={duplicateModule}
                  onAddLesson={addLesson}
                  onEditLesson={editLesson}
                  onDeleteLesson={deleteLesson}
                  onDuplicateLesson={duplicateLesson}
                  onLessonReorder={handleLessonReorder}
                  onSelectLesson={setSelectedLesson}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {modules.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <FileText className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No modules yet</p>
            <button onClick={addModule} className="mt-2 text-sm text-blue-600 font-medium hover:underline">+ Add first module</button>
          </div>
        )}
      </div>

      {/* Right: Article Editor */}
      <div className="flex-1 min-w-0">
        {selectedLesson ? (
          <ArticleEditor
            key={selectedLesson.id}
            lesson={selectedLesson}
            onSave={handleLessonContentSave}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <BookOpen className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
            <p className="font-semibold text-gray-500">Select an article to edit</p>
            <p className="text-sm text-gray-400 mt-1">Click any article in the module tree on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
