"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Save, Bold, Italic, Underline, List, ListOrdered, Link2,
  Minus, Info, AlertTriangle, CheckCircle, RotateCcw, RotateCw,
  FileText, Clock, Image as ImageIcon, Table, Code, Quote,
} from "lucide-react";

interface Props {
  lesson: { id: string; title: string; content: string; estimated_reading_time: number };
  onSave: (lessonId: string, content: string, readTime: number) => void;
}

function TB({
  onClick, title, children, active = false,
}: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`inline-flex items-center justify-center px-2 py-1.5 rounded-md text-xs transition-colors ${
        active
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          : "text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5 self-center inline-block shrink-0" />;
}

export function ArticleEditor({ lesson, onSave }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(lesson.estimated_reading_time || 5);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Set initial content once on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = lesson.content || "<p>Start writing your article content here...</p>";
      updateStats();
    }
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStats = useCallback(() => {
    const text = editorRef.current?.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setReadTime(Math.max(1, Math.ceil(words / 200)));
  }, []);

  const doSave = useCallback(async (showToast = false) => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const rt = Math.max(1, Math.ceil(words / 200));
    setSaving(true);
    try {
      const res = await fetch("/api/admin/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_LESSON", id: lesson.id, content, estimated_reading_time: rt }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Save failed"); }
      setLastSaved(new Date());
      onSave(lesson.id, content, rt);
      if (showToast) toast.success("Article saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }, [lesson.id, onSave]);

  const scheduleAutoSave = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(), 2000);
  }, [doSave]);

  const handleInput = useCallback(() => {
    updateStats();
    scheduleAutoSave();
  }, [updateStats, scheduleAutoSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      clearTimeout(timerRef.current);
      doSave(true);
    }
  }, [doSave]);

  // Use onMouseDown to prevent blur before execCommand
  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  }, [handleInput]);

  const ins = useCallback((html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    handleInput();
  }, [handleInput]);

  const insertTable = () => ins(
    `<table style="width:100%;border-collapse:collapse;margin:1rem 0">` +
    `<thead><tr>` +
    `<th style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;text-align:left">Header 1</th>` +
    `<th style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;text-align:left">Header 2</th>` +
    `<th style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;text-align:left">Header 3</th>` +
    `</tr></thead><tbody>` +
    `<tr><td style="border:1px solid #d1d5db;padding:8px">Cell</td><td style="border:1px solid #d1d5db;padding:8px">Cell</td><td style="border:1px solid #d1d5db;padding:8px">Cell</td></tr>` +
    `<tr><td style="border:1px solid #d1d5db;padding:8px">Cell</td><td style="border:1px solid #d1d5db;padding:8px">Cell</td><td style="border:1px solid #d1d5db;padding:8px">Cell</td></tr>` +
    `</tbody></table><p><br></p>`
  );

  const insertImage = () => {
    const url = window.prompt("Image URL:");
    if (url?.trim()) {
      ins(`<figure style="margin:1.5rem 0;text-align:center"><img src="${url.trim()}" alt="Article image" style="max-width:100%;border-radius:12px;border:1px solid #e5e7eb" /><figcaption style="font-size:0.875rem;color:#6b7280;margin-top:0.5rem">Image</figcaption></figure><p><br></p>`);
    }
  };

  const insertLink = () => {
    const url = window.prompt("Link URL (https://...):");
    if (url?.trim()) exec("createLink", url.trim());
  };

  const insertCallout = (type: "info" | "warning" | "tip") => {
    const cfg = {
      info: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af", icon: "💡", label: "Note" },
      warning: { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", icon: "⚠️", label: "Warning" },
      tip: { bg: "#f0fdf4", border: "#22c55e", text: "#14532d", icon: "✅", label: "Tip" },
    };
    const c = cfg[type];
    ins(
      `<div style="background:${c.bg};border-left:4px solid ${c.border};padding:1rem;border-radius:0 8px 8px 0;margin:1rem 0">` +
      `<p style="font-weight:600;color:${c.text};margin:0 0 0.25rem">${c.icon} ${c.label}</p>` +
      `<p style="color:${c.text};margin:0">Add your ${type} text here.</p>` +
      `</div><p><br></p>`
    );
  };

  const savedLabel = lastSaved
    ? (() => {
        const secs = Math.round((Date.now() - lastSaved.getTime()) / 1000);
        return secs < 60 ? `Saved ${secs}s ago` : `Saved ${Math.floor(secs / 60)}m ago`;
      })()
    : null;

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{lesson.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />{readTime} min
          </span>
          <span className="hidden sm:block text-xs text-gray-400">{wordCount}w</span>
          {saving && <span className="text-xs text-blue-500 animate-pulse">Saving…</span>}
          {!saving && savedLabel && <span className="text-xs text-emerald-500">✓ {savedLabel}</span>}
          <button
            onClick={() => doSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />Save
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/40 shrink-0 overflow-x-auto">
        <TB onClick={() => exec("undo")} title="Undo (Ctrl+Z)"><RotateCcw className="w-3.5 h-3.5" /></TB>
        <TB onClick={() => exec("redo")} title="Redo (Ctrl+Y)"><RotateCw className="w-3.5 h-3.5" /></TB>
        <Sep />
        <TB onClick={() => exec("formatBlock", "h1")} title="Heading 1"><span className="font-black text-sm">H1</span></TB>
        <TB onClick={() => exec("formatBlock", "h2")} title="Heading 2"><span className="font-bold text-sm">H2</span></TB>
        <TB onClick={() => exec("formatBlock", "h3")} title="Heading 3"><span className="font-semibold text-sm">H3</span></TB>
        <TB onClick={() => exec("formatBlock", "p")} title="Paragraph"><span className="text-xs">¶</span></TB>
        <Sep />
        <TB onClick={() => exec("bold")} title="Bold (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></TB>
        <TB onClick={() => exec("italic")} title="Italic (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></TB>
        <TB onClick={() => exec("underline")} title="Underline (Ctrl+U)"><Underline className="w-3.5 h-3.5" /></TB>
        <Sep />
        <TB onClick={() => exec("insertUnorderedList")} title="Bullet List"><List className="w-3.5 h-3.5" /></TB>
        <TB onClick={() => exec("insertOrderedList")} title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></TB>
        <Sep />
        <TB
          onClick={() => ins(`<blockquote style="border-left:4px solid #3b82f6;background:#eff6ff;padding:0.75rem 1rem;border-radius:0 8px 8px 0;margin:1rem 0;font-style:italic;color:#374151"><p style="margin:0">Quote text here...</p></blockquote><p><br></p>`)}
          title="Blockquote"
        ><Quote className="w-3.5 h-3.5" /></TB>
        <TB
          onClick={() => ins(`<pre style="background:#111827;color:#4ade80;padding:1rem;border-radius:12px;margin:1rem 0;font-family:monospace;font-size:0.875rem;overflow-x:auto;white-space:pre-wrap"><code>// Your code here</code></pre><p><br></p>`)}
          title="Code Block"
        ><Code className="w-3.5 h-3.5" /></TB>
        <TB onClick={() => insertCallout("info")} title="Info Callout"><Info className="w-3.5 h-3.5 text-blue-500" /></TB>
        <TB onClick={() => insertCallout("warning")} title="Warning Callout"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" /></TB>
        <TB onClick={() => insertCallout("tip")} title="Tip Callout"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /></TB>
        <Sep />
        <TB onClick={insertTable} title="Insert Table"><Table className="w-3.5 h-3.5" /></TB>
        <TB onClick={insertImage} title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></TB>
        <TB onClick={insertLink} title="Insert Link"><Link2 className="w-3.5 h-3.5" /></TB>
        <TB onClick={() => ins(`<hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0" /><p><br></p>`)} title="Divider"><Minus className="w-3.5 h-3.5" /></TB>
      </div>

      {/* Content editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck
        role="textbox"
        aria-multiline="true"
        aria-label={`Article: ${lesson.title}`}
        className="flex-1 overflow-y-auto px-8 py-6 focus:outline-none min-h-[400px]
          text-gray-800 dark:text-gray-200 leading-relaxed text-base
          [&>*+*]:mt-3
          [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-gray-900 dark:[&_h1]:text-white [&_h1]:mt-6 [&_h1]:mb-2
          [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mt-5 [&_h2]:mb-2
          [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-1
          [&_p]:text-gray-700 dark:[&_p]:text-gray-300 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1
          [&_li]:text-gray-700 dark:[&_li]:text-gray-300
          [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:font-bold [&_em]:italic
          [&_img]:max-w-full [&_img]:rounded-xl
          [&_figure]:my-4 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-gray-400
          [&_blockquote]:border-l-4 [&_blockquote]:border-blue-400 [&_blockquote]:pl-4 [&_blockquote]:italic
          [&_pre]:bg-gray-900 dark:[&_pre]:bg-gray-950 [&_pre]:text-green-400 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:overflow-x-auto
          [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
          [&_table]:w-full [&_table]:border-collapse
          [&_th]:border [&_th]:border-gray-300 dark:[&_th]:border-gray-600 [&_th]:p-2 [&_th]:bg-gray-50 dark:[&_th]:bg-gray-800 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sm
          [&_td]:border [&_td]:border-gray-300 dark:[&_td]:border-gray-600 [&_td]:p-2 [&_td]:text-sm
          [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-gray-200 dark:[&_hr]:border-gray-700"
      />

      {/* Status footer */}
      <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 text-xs text-gray-400 shrink-0">
        <span>{wordCount} words · ~{readTime} min read</span>
        <span>Ctrl+S to save</span>
      </div>
    </div>
  );
}
