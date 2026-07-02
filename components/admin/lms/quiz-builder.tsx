"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Copy, ChevronDown, ChevronUp, Check, X,
  ClipboardList, AlertCircle, Download, Upload, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Option { id?: string; content: string; is_correct: boolean }
interface Question {
  id: string; content: string; type: string; points: number;
  difficulty: string; explanation: string; sequence_order: number;
  options: Option[];
}
interface Quiz { id: string; module_id: string; title: string; passing_score: number; questions: Question[] }

interface Props {
  courseId: string;
  modules: any[];
  quizzes: Quiz[];
  onChange: (quizzes: Quiz[]) => void;
}

const EMPTY_Q = (): Omit<Question, "id" | "sequence_order"> => ({
  content: "",
  type: "single_choice",
  points: 1,
  difficulty: "medium",
  explanation: "",
  options: [
    { content: "", is_correct: true },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
    { content: "", is_correct: false },
  ],
});

function QuestionCard({
  q, index, onUpdate, onDelete, onDuplicate,
}: {
  q: Question; index: number;
  onUpdate: (id: string, updated: Partial<Question>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [open, setOpen] = useState(index === 0);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const set = (k: keyof Question, v: any) => onUpdate(q.id, { [k]: v });
  const setOption = (i: number, k: keyof Option, v: any) => {
    const opts = q.options.map((o, j) => {
      if (k === "is_correct") return { ...o, is_correct: j === i };
      return j === i ? { ...o, [k]: v } : o;
    });
    onUpdate(q.id, { options: opts });
  };

  const diffColors: Record<string, string> = {
    easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-2xl border transition-all ${isDragging ? "opacity-50 shadow-xl" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-900`}
    >
      {/* Question header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(!open)}>
        <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab text-gray-300 hover:text-gray-500">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-black text-blue-700 dark:text-blue-300 shrink-0">
          {index + 1}
        </div>
        <p className={`flex-1 text-sm font-medium truncate ${q.content ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
          {q.content || "Untitled question"}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${diffColors[q.difficulty] || diffColors.medium}`}>
            {q.difficulty}
          </span>
          <span className="text-xs text-gray-400">{q.points}pt{q.points !== 1 ? "s" : ""}</span>
          <button onClick={(e) => { e.stopPropagation(); onDuplicate(q.id); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete this question?")) onDelete(q.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {/* Question body */}
      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
          {/* Question text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Question</label>
            <textarea
              value={q.content}
              onChange={(e) => set("content", e.target.value)}
              rows={2}
              placeholder="Enter your question..."
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Meta row */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Difficulty</label>
              <select value={q.difficulty} onChange={(e) => set("difficulty", e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="w-20 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Marks</label>
              <input type="number" min="1" value={q.points} onChange={(e) => set("points", parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Options (click radio to mark correct)</label>
            {q.options.map((opt, i) => (
              <div key={i} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${opt.is_correct ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10" : "border-gray-200 dark:border-gray-700"}`}>
                <button
                  type="button"
                  onClick={() => setOption(i, "is_correct", true)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-gray-300 dark:border-gray-600 hover:border-emerald-400"}`}
                >
                  {opt.is_correct && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="w-5 text-xs font-bold text-gray-500 shrink-0">{["A", "B", "C", "D"][i]}</span>
                <input
                  value={opt.content}
                  onChange={(e) => setOption(i, "content", e.target.value)}
                  placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
                />
                {opt.is_correct && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">CORRECT</span>}
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Explanation (shown after answer)</label>
            <textarea
              value={q.explanation}
              onChange={(e) => set("explanation", e.target.value)}
              rows={2}
              placeholder="Why is this the correct answer?"
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function QuizBuilder({ courseId, modules, quizzes, onChange }: Props) {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(quizzes[0]?.id || null);
  const [loading, setLoading] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null);

  const isCert = modules.length <= 5;
  const targetMCQs = isCert ? 10 : 20;

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
  const totalMCQs = quizzes.reduce((a, q) => a + q.questions.length, 0);

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

  const createQuiz = async (moduleId: string) => {
    const data = await api("CREATE_QUIZ", { moduleId, title: "Final Assessment", passing_score: 70 });
    if (data) {
      const newQuiz = { ...data, questions: [] };
      onChange([...quizzes, newQuiz]);
      setSelectedQuizId(data.id);
      toast.success("Quiz created");
    }
  };

  const addQuestion = async () => {
    if (!selectedQuiz) return;
    const q = EMPTY_Q();
    const data = await api("CREATE_QUESTION", { quizId: selectedQuiz.id, ...q, options: q.options });
    if (data) {
      onChange(quizzes.map((qz) => qz.id === selectedQuiz.id ? { ...qz, questions: [...qz.questions, data] } : qz));
    }
  };

  const updateQuestion = useCallback(async (questionId: string, updates: Partial<Question>) => {
    setSavingQuestion(questionId);
    // Update local state immediately
    onChange(quizzes.map((qz) => ({
      ...qz,
      questions: qz.questions.map((q) => q.id === questionId ? { ...q, ...updates } : q),
    })));

    // Debounce: save after 1.5s
    const q = quizzes.flatMap((qz) => qz.questions).find((q) => q.id === questionId);
    if (!q) { setSavingQuestion(null); return; }
    const merged = { ...q, ...updates };
    try {
      await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_QUESTION", id: questionId, content: merged.content, type: merged.type, points: merged.points, difficulty: merged.difficulty, explanation: merged.explanation, options: merged.options }),
      });
    } catch {}
    setSavingQuestion(null);
  }, [quizzes, onChange]);

  const deleteQuestion = async (questionId: string) => {
    await api("DELETE_QUESTION", { id: questionId });
    onChange(quizzes.map((qz) => ({ ...qz, questions: qz.questions.filter((q) => q.id !== questionId) })));
    toast.success("Question deleted");
  };

  const duplicateQuestion = async (questionId: string) => {
    const q = quizzes.flatMap((qz) => qz.questions).find((q) => q.id === questionId);
    if (!q || !selectedQuiz) return;
    const data = await api("CREATE_QUESTION", {
      quizId: selectedQuiz.id,
      content: `${q.content} (Copy)`,
      type: q.type, points: q.points, difficulty: q.difficulty,
      explanation: q.explanation, options: q.options,
    });
    if (data) onChange(quizzes.map((qz) => qz.id === selectedQuiz.id ? { ...qz, questions: [...qz.questions, data] } : qz));
    toast.success("Duplicated");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!selectedQuiz) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const qs = selectedQuiz.questions;
    const oldIdx = qs.findIndex((q) => q.id === active.id);
    const newIdx = qs.findIndex((q) => q.id === over.id);
    const reordered = arrayMove(qs, oldIdx, newIdx).map((q, i) => ({ ...q, sequence_order: i + 1 }));
    onChange(quizzes.map((qz) => qz.id === selectedQuiz.id ? { ...qz, questions: reordered } : qz));
    await api("REORDER_QUESTIONS", { items: reordered.map((q) => ({ id: q.id, sequence_order: q.sequence_order })) });
  };

  const handleBulkImport = async () => {
    if (!selectedQuiz) return;
    try {
      const imported = JSON.parse(bulkJson);
      if (!Array.isArray(imported)) throw new Error("Must be a JSON array");
      for (const q of imported) {
        if (!q.content || !Array.isArray(q.options) || q.options.length !== 4) throw new Error("Each question needs 'content' and 4 'options'");
      }
      let newQuizzes = [...quizzes];
      for (const q of imported) {
        const data = await api("CREATE_QUESTION", { quizId: selectedQuiz.id, content: q.content, type: "single_choice", points: q.points || 1, difficulty: q.difficulty || "medium", explanation: q.explanation || "", options: q.options });
        if (data) {
          newQuizzes = newQuizzes.map((qz) => qz.id === selectedQuiz.id ? { ...qz, questions: [...qz.questions, data] } : qz);
        }
      }
      onChange(newQuizzes);
      setBulkJson("");
      setBulkImportOpen(false);
      toast.success(`Imported ${imported.length} questions`);
    } catch (e: any) {
      toast.error(`Import failed: ${e.message}`);
    }
  };

  const updateQuizSettings = async (field: string, value: any) => {
    if (!selectedQuiz) return;
    const data = await api("UPDATE_QUIZ", { id: selectedQuiz.id, title: selectedQuiz.title, passing_score: selectedQuiz.passing_score, [field]: value });
    if (data) onChange(quizzes.map((qz) => qz.id === selectedQuiz.id ? { ...qz, [field]: value } : qz));
  };

  const moduleWithoutQuiz = modules.find((m) => !quizzes.some((q) => q.module_id === m.id));

  const SAMPLE_JSON = JSON.stringify([
    { content: "Question text here", difficulty: "medium", points: 1, explanation: "Why this is correct", options: [{ content: "Correct answer", is_correct: true }, { content: "Wrong answer", is_correct: false }, { content: "Wrong answer", is_correct: false }, { content: "Wrong answer", is_correct: false }] },
  ], null, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quiz Builder</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Target: <span className={`font-bold ${totalMCQs === targetMCQs ? "text-emerald-600" : totalMCQs > targetMCQs ? "text-red-600" : "text-amber-600"}`}>{totalMCQs}/{targetMCQs} MCQs</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedQuiz && (
            <button onClick={() => setBulkImportOpen(true)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Bulk Import
            </button>
          )}
          {selectedQuiz && (
            <button onClick={addQuestion} disabled={!!loading} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60">
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quiz Progress</span>
          <span className={`text-sm font-bold ${totalMCQs === targetMCQs ? "text-emerald-600" : "text-gray-500"}`}>{totalMCQs}/{targetMCQs}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${totalMCQs === targetMCQs ? "bg-emerald-500" : totalMCQs > targetMCQs ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${Math.min(100, (totalMCQs / targetMCQs) * 100)}%` }}
          />
        </div>
        {totalMCQs > targetMCQs && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />You have {totalMCQs - targetMCQs} extra questions. Reduce to exactly {targetMCQs}.</p>
        )}
      </div>

      {/* Quiz selector */}
      {quizzes.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quiz</label>
              <select value={selectedQuizId || ""} onChange={(e) => setSelectedQuizId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {quizzes.map((qz) => (
                  <option key={qz.id} value={qz.id}>{qz.title} ({qz.questions.length} questions)</option>
                ))}
              </select>
            </div>
            {selectedQuiz && (
              <>
                <div className="w-40 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Passing Score (%)</label>
                  <input type="number" min="1" max="100" defaultValue={selectedQuiz.passing_score} onBlur={(e) => updateQuizSettings("passing_score", parseInt(e.target.value) || 70)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quiz Title</label>
                  <input defaultValue={selectedQuiz.title} onBlur={(e) => updateQuizSettings("title", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Create quiz if none */}
      {quizzes.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <ClipboardList className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No quiz yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Create a quiz for this product</p>
          {modules.length > 0 ? (
            <button onClick={() => createQuiz(modules[modules.length - 1].id)} disabled={!!loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60">
              + Create Quiz
            </button>
          ) : (
            <p className="text-sm text-amber-600">Add at least one module first</p>
          )}
        </div>
      )}

      {/* Option to add quiz to another module */}
      {quizzes.length > 0 && moduleWithoutQuiz && (
        <button onClick={() => createQuiz(moduleWithoutQuiz.id)} className="text-sm text-blue-600 font-medium hover:underline">
          + Add quiz to module: {moduleWithoutQuiz.title}
        </button>
      )}

      {/* Questions list */}
      {selectedQuiz && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedQuiz.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {selectedQuiz.questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  onUpdate={updateQuestion}
                  onDelete={deleteQuestion}
                  onDuplicate={duplicateQuestion}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {selectedQuiz && selectedQuiz.questions.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-gray-400 font-medium">No questions yet</p>
          <button onClick={addQuestion} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            + Add First Question
          </button>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white">Bulk Import Questions</h3>
              <button onClick={() => setBulkImportOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Paste JSON array of questions. Each must have <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">content</code> and exactly 4 <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">options</code>.</p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-2 font-semibold">Example format:</p>
                <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-x-auto">{SAMPLE_JSON}</pre>
              </div>
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                rows={10}
                placeholder="Paste your JSON here..."
                className="w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex gap-3">
                <button onClick={() => setBulkImportOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                <button onClick={handleBulkImport} disabled={!bulkJson.trim()} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                  Import Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
