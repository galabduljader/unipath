"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { createClient } from "./supabase/client";
import { useAuth } from "./auth";

export type Notification = {
  id: string; icon: string; title: string; body: string | null;
  link: string | null; read: boolean; created_at: string;
};
export type Reminder = {
  id: string; text: string; due: string | null; course: string | null; done: boolean;
};
export type ProgramCourse = { code: string; title: string; credits: number };
export type EventType = "exam" | "assignment" | "quiz" | "project" | "class" | "other";
export type CalEvent = {
  id: string; title: string; type: EventType; event_date: string;
  event_time: string | null; course: string | null; notes: string | null;
};

type DataCtx = {
  ready: boolean;
  completed: Set<string>;
  grades: Record<string, string>;
  notifications: Notification[];
  reminders: Reminder[];
  notes: string;
  programCourses: ProgramCourse[];
  events: CalEvent[];
  unreadCount: number;
  toggleCompleted: (code: string) => void;
  setCompletedBulk: (codes: string[]) => Promise<void>;
  setGrade: (code: string, value: string, meta?: { title?: string; credits?: number; term?: string }) => void;
  recordTakenCourse: (c: { code: string; title: string; credits: number; grade: string }) => Promise<void>;
  markAllRead: () => Promise<void>;
  openNotification: (n: Notification) => Promise<void>;
  addReminder: (r: { text: string; due: string; course: string }) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  delReminder: (id: string) => Promise<void>;
  saveNotes: (v: string) => void;
  setProgramCourses: (courses: ProgramCourse[]) => Promise<void>;
  addEvent: (e: { title: string; type: EventType; event_date: string; event_time?: string; course?: string; notes?: string }) => Promise<void>;
  delEvent: (id: string) => Promise<void>;
};

const Ctx = createContext<DataCtx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useRef(createClient()).current;
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState("");
  const [programCourses, setProgramCoursesState] = useState<ProgramCourse[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // initial load
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [cc, gr, nf, rm, nt, pc, ev] = await Promise.all([
        supabase.from("completed_courses").select("code").eq("user_id", user.id),
        supabase.from("grades").select("code, grade").eq("user_id", user.id),
        supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reminders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("notes").select("content").eq("user_id", user.id).maybeSingle(),
        supabase.from("program_courses").select("code, title, credits").eq("user_id", user.id).order("sort"),
        supabase.from("events").select("*").eq("user_id", user.id).order("event_date"),
      ]);
      if (!active) return;
      setCompleted(new Set((cc.data ?? []).map((r) => r.code as string)));
      const go: Record<string, string> = {};
      (gr.data ?? []).forEach((r) => { if (r.grade) go[r.code as string] = r.grade as string; });
      setGrades(go);
      setNotifications((nf.data as Notification[]) ?? []);
      setReminders((rm.data as Reminder[]) ?? []);
      setNotes((nt.data?.content as string) ?? "");
      setProgramCoursesState((pc.data as ProgramCourse[]) ?? []);
      setEvents((ev.data as CalEvent[]) ?? []);
      setReady(true);
    })();
    return () => { active = false; };
  }, [user, supabase]);

  // realtime: notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => {
            if (payload.eventType === "INSERT") return [payload.new as Notification, ...prev];
            if (payload.eventType === "UPDATE")
              return prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n));
            if (payload.eventType === "DELETE")
              return prev.filter((n) => n.id !== (payload.old as Notification).id);
            return prev;
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, supabase]);

  const toggleCompleted = useCallback(
    (code: string) => {
      if (!user) return;
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(code)) {
          next.delete(code);
          supabase.from("completed_courses").delete().eq("user_id", user.id).eq("code", code).then(() => {});
        } else {
          next.add(code);
          supabase.from("completed_courses").insert({ user_id: user.id, code }).then(() => {});
        }
        return next;
      });
    },
    [user, supabase]
  );

  const setCompletedBulk = useCallback(
    async (codes: string[]) => {
      if (!user) return;
      setCompleted(new Set(codes));
      await supabase.from("completed_courses").delete().eq("user_id", user.id);
      if (codes.length)
        await supabase.from("completed_courses").insert(codes.map((code) => ({ user_id: user.id, code })));
    },
    [user, supabase]
  );

  const setGrade = useCallback(
    (code: string, value: string, meta?: { title?: string; credits?: number; term?: string }) => {
      if (!user) return;
      setGrades((prev) => ({ ...prev, [code]: value }));
      const row: Record<string, unknown> = { user_id: user.id, code, grade: value };
      if (meta?.title != null) row.title = meta.title;
      if (meta?.credits != null) row.credits = meta.credits;
      if (meta?.term != null) row.term = meta.term;
      supabase.from("grades").upsert(row, { onConflict: "user_id,code" }).then(() => {});
    },
    [user, supabase]
  );

  // Record a course the student has taken (marks it completed + saves its grade/details).
  const recordTakenCourse = useCallback(
    async (c: { code: string; title: string; credits: number; grade: string }) => {
      if (!user) return;
      setCompleted((prev) => new Set(prev).add(c.code));
      setGrades((prev) => ({ ...prev, [c.code]: c.grade }));
      await supabase.from("completed_courses").upsert({ user_id: user.id, code: c.code }, { onConflict: "user_id,code" });
      await supabase.from("grades").upsert(
        { user_id: user.id, code: c.code, title: c.title, credits: c.credits, grade: c.grade || null },
        { onConflict: "user_id,code" }
      );
    },
    [user, supabase]
  );

  const markAllRead = useCallback(async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  }, [user, supabase]);

  const openNotification = useCallback(
    async (n: Notification) => {
      if (!user) return;
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    },
    [user, supabase]
  );

  const addReminder = useCallback(
    async (r: { text: string; due: string; course: string }) => {
      if (!user) return;
      const { data } = await supabase
        .from("reminders")
        .insert({ user_id: user.id, text: r.text, due: r.due || null, course: r.course === "—" ? null : r.course || null, done: false })
        .select()
        .single();
      if (data) setReminders((prev) => [data as Reminder, ...prev]);
    },
    [user, supabase]
  );

  const toggleReminder = useCallback(
    async (id: string) => {
      const cur = reminders.find((r) => r.id === id);
      if (!cur) return;
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
      await supabase.from("reminders").update({ done: !cur.done }).eq("id", id);
    },
    [reminders, supabase]
  );

  const delReminder = useCallback(
    async (id: string) => {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      await supabase.from("reminders").delete().eq("id", id);
    },
    [supabase]
  );

  const saveNotes = useCallback(
    (v: string) => {
      if (!user) return;
      setNotes(v);
      if (notesTimer.current) clearTimeout(notesTimer.current);
      notesTimer.current = setTimeout(() => {
        supabase.from("notes").upsert({ user_id: user.id, content: v, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).then(() => {});
      }, 600);
    },
    [user, supabase]
  );

  const setProgramCourses = useCallback(
    async (courses: ProgramCourse[]) => {
      if (!user) return;
      setProgramCoursesState(courses);
      await supabase.from("program_courses").delete().eq("user_id", user.id);
      if (courses.length)
        await supabase.from("program_courses").insert(
          courses.map((c, i) => ({ user_id: user.id, code: c.code, title: c.title, credits: c.credits, sort: i }))
        );
    },
    [user, supabase]
  );

  const addEvent = useCallback(
    async (e: { title: string; type: EventType; event_date: string; event_time?: string; course?: string; notes?: string }) => {
      if (!user) return;
      const { data } = await supabase
        .from("events")
        .insert({
          user_id: user.id, title: e.title, type: e.type, event_date: e.event_date,
          event_time: e.event_time || null, course: e.course || null, notes: e.notes || null,
        })
        .select()
        .single();
      if (data) setEvents((prev) => [...prev, data as CalEvent].sort((a, b) => a.event_date.localeCompare(b.event_date)));
    },
    [user, supabase]
  );

  const delEvent = useCallback(
    async (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      await supabase.from("events").delete().eq("id", id);
    },
    [supabase]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Ctx.Provider
      value={{
        ready, completed, grades, notifications, reminders, notes, programCourses, events, unreadCount,
        toggleCompleted, setCompletedBulk, setGrade, recordTakenCourse, markAllRead, openNotification,
        addReminder, toggleReminder, delReminder, saveNotes,
        setProgramCourses, addEvent, delEvent,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
