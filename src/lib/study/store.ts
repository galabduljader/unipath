// Study Notebook data layer. MVP persistence is per-user localStorage so the whole
// feature works with no backend deploy; the shapes map cleanly onto Supabase tables
// later. Source ingestion reuses the app's existing text extraction (PDF/DOCX/image).

import { extractText } from "@/lib/parseSheet";

export type StudyRole = "user" | "assistant";
export type StudyMessage = { role: StudyRole; content: string };

export type StudySource = {
  id: string;
  kind: "file" | "text";
  title: string;
  text: string; // extracted/pasted plain text used to ground answers
  addedAt: number;
};

// A generated study kit powers the slides, audio overview, and video overview.
export type Slide = { title: string; bullets: string[]; narration: string };
export type StudyKit = { slides: Slide[]; questions: string[]; by: "quick" | "ai"; at: number };

export type StudyNotebook = {
  id: string;
  name: string;
  emoji: string;
  sources: StudySource[];
  messages: StudyMessage[];
  kit?: StudyKit;
  createdAt: number;
};

const KEY = (userId: string) => `unipath.study.${userId || "guest"}`;
const uid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.round(Math.random() * 1e6)}`);

export function loadNotebooks(userId: string): StudyNotebook[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY(userId));
    return raw ? (JSON.parse(raw) as StudyNotebook[]) : [];
  } catch {
    return [];
  }
}

export function saveNotebooks(userId: string, notebooks: StudyNotebook[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(notebooks));
  } catch {
    /* quota / private mode — non-fatal */
  }
}

const EMOJIS = ["📗", "📘", "📙", "📕", "📓", "🧪", "🧠", "📐"];

export function newNotebook(name: string, seed = 0): StudyNotebook {
  return {
    id: uid(),
    name: name.trim() || "Untitled notebook",
    emoji: EMOJIS[seed % EMOJIS.length],
    sources: [],
    messages: [],
    createdAt: Date.now(),
  };
}

export function makeTextSource(title: string, text: string): StudySource {
  return { id: uid(), kind: "text", title: title.trim() || "Note", text: text.trim(), addedAt: Date.now() };
}

// Extract plain text from an uploaded file (reuses parseSheet's extractText, which
// handles PDF, DOCX, images via OCR, and plain text). Returns a source or throws.
export async function makeFileSource(file: File): Promise<StudySource> {
  const text = (await extractText(file)).trim();
  return { id: uid(), kind: "file", title: file.name, text, addedAt: Date.now() };
}

// Combine a notebook's sources into a single grounding context for the model.
export function sourcesContext(notebook: StudyNotebook, maxChars = 24000): string {
  if (!notebook.sources.length) return "";
  const parts = notebook.sources.map((s, i) => `### Source ${i + 1}: ${s.title}\n${s.text}`);
  const joined = parts.join("\n\n");
  return joined.length > maxChars ? joined.slice(0, maxChars) + "\n\n[…sources truncated…]" : joined;
}
