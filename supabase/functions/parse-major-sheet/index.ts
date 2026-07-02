// parse-major-sheet — the extraction job.
//
// Flow (doc Section 3): the client uploads the file straight to the private
// `major-sheets` Storage bucket and inserts a `major_sheets` row (status pending),
// then invokes this function with { sheetId }. Here we:
//   1. verify the caller owns the sheet, flip status -> processing
//   2. download the file (service role — never exposed to the client)
//   3. prepare model input by type (pdf/image -> vision block; xlsx/csv -> text;
//      docx -> text)
//   4. call Claude via OpenRouter, forcing the extract_major_sheet tool
//   5. Zod-validate, then graph-validate (dangling refs, dedup, cycles)
//   6. idempotently replace courses + derived course_edges, flip status -> ready
//      (or failed + error)
//
// Secrets: OPENROUTER_API_KEY (Supabase secret). SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY are injected by the Edge runtime.

import { createClient } from "npm:@supabase/supabase-js@^2.108.2";
import { encodeBase64 } from "jsr:@std/encoding@^1/base64";
import {
  EXTRACT_TOOL_INPUT_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  majorSheetSchema,
  validateSheet,
} from "../_shared/majorSheet.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = Deno.env.get("EXTRACT_MODEL") ?? "anthropic/claude-sonnet-4.5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

function extOf(path: string, mime: string): string {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (m) return m[1];
  if (mime.includes("pdf")) return "pdf";
  if (mime.startsWith("image/")) return mime.split("/")[1] ?? "png";
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "xlsx";
  if (mime.includes("word") || mime.includes("officedocument.wordprocessing")) return "docx";
  if (mime.includes("csv")) return "csv";
  return "";
}

// Turn the raw file into the model's user-message content, choosing vision vs text.
async function buildContent(bytes: Uint8Array, ext: string, mime: string, filename: string): Promise<ContentPart[]> {
  const preface: ContentPart = {
    type: "text",
    text: "Extract every course from this university major sheet by calling the extract_major_sheet tool. Preserve prerequisite AND/OR logic and any color legend.",
  };

  if (ext === "pdf") {
    const dataUrl = `data:application/pdf;base64,${encodeBase64(bytes)}`;
    return [preface, { type: "file", file: { filename: filename || "sheet.pdf", file_data: dataUrl } }];
  }

  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "heif"].includes(ext) || mime.startsWith("image/")) {
    const imgMime = mime.startsWith("image/") ? mime : `image/${ext === "jpg" ? "jpeg" : ext}`;
    const dataUrl = `data:${imgMime};base64,${encodeBase64(bytes)}`;
    return [preface, { type: "image_url", image_url: { url: dataUrl } }];
  }

  if (ext === "xlsx" || ext === "xls" || ext === "csv" || mime.includes("spreadsheet") || mime.includes("excel")) {
    const XLSX = await import("npm:xlsx@^0.18.5");
    const wb = XLSX.read(bytes, { type: "array" });
    const text = wb.SheetNames.map((n: string) => `# Sheet: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n])}`).join("\n\n");
    return [{ type: "text", text: `${preface.text}\n\nSpreadsheet contents (CSV):\n\n${text}` }];
  }

  if (ext === "docx" || ext === "doc" || mime.includes("word") || mime.includes("officedocument")) {
    const mammoth = (await import("npm:mammoth@^1.12.0")).default;
    // mammoth accepts an arrayBuffer view; slice to the exact byte range.
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const res = await mammoth.extractRawText({ arrayBuffer: ab });
    return [{ type: "text", text: `${preface.text}\n\nDocument text:\n\n${res.value}` }];
  }

  // plain text / unknown → decode as UTF-8
  const text = new TextDecoder().decode(bytes);
  return [{ type: "text", text: `${preface.text}\n\nSheet text:\n\n${text}` }];
}

async function callModel(content: ContentPart[]): Promise<unknown> {
  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) throw new Error("OPENROUTER_API_KEY is not configured in Edge Function secrets.");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://unipath.app",
      "X-Title": "UniPath major-sheet parser",
    },
    body: JSON.stringify({
      model: MODEL,
      // Let OpenRouter use the model's native PDF/vision capability.
      plugins: [{ id: "file-parser", pdf: { engine: "native" } }],
      messages: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_major_sheet",
            description: "Return the structured degree plan extracted from the sheet.",
            parameters: EXTRACT_TOOL_INPUT_SCHEMA,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_major_sheet" } },
      temperature: 0,
    }),
  });

  if (!res.ok) throw new Error(`Model call failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  const args = toolCall?.function?.arguments;
  if (!args) throw new Error("Model did not return an extract_major_sheet tool call.");
  return typeof args === "string" ? JSON.parse(args) : args;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // Identify the caller from their JWT (RLS-scoped anon client).
  const asUser = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes } = await asUser.auth.getUser();
  const user = userRes?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  let sheetId: string | undefined;
  try {
    ({ sheetId } = await req.json());
  } catch {
    return json({ error: "Expected JSON body { sheetId }" }, 400);
  }
  if (!sheetId) return json({ error: "Missing sheetId" }, 400);

  // Service-role client for storage + writes; we enforce ownership ourselves.
  const admin = createClient(url, serviceKey);

  const { data: sheet, error: loadErr } = await admin
    .from("major_sheets")
    .select("id, user_id, source_file_path, source_mime")
    .eq("id", sheetId)
    .single();
  if (loadErr || !sheet) return json({ error: "Sheet not found" }, 404);
  if (sheet.user_id !== user.id) return json({ error: "Forbidden" }, 403);
  if (!sheet.source_file_path) return json({ error: "Sheet has no source file" }, 400);

  const fail = async (message: string) => {
    await admin.from("major_sheets").update({ status: "failed", error: message }).eq("id", sheetId);
    return json({ status: "failed", error: message }, 200);
  };

  try {
    await admin.from("major_sheets").update({ status: "processing", error: null }).eq("id", sheetId);

    const { data: blob, error: dlErr } = await admin.storage.from("major-sheets").download(sheet.source_file_path);
    if (dlErr || !blob) return await fail(`Could not download the uploaded file: ${dlErr?.message ?? "unknown"}`);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const mime = sheet.source_mime ?? blob.type ?? "";
    const ext = extOf(sheet.source_file_path, mime);
    const filename = sheet.source_file_path.split("/").pop() ?? "sheet";

    const content = await buildContent(bytes, ext, mime, filename);
    const raw = await callModel(content);

    // Untrusted model output — validate before it touches typed tables.
    const parsed = majorSheetSchema.safeParse(raw);
    if (!parsed.success) {
      return await fail(`Extraction failed validation: ${parsed.error.issues.map((i) => i.message).join("; ").slice(0, 500)}`);
    }

    const { courses, edges, warnings } = validateSheet(parsed.data);

    // Idempotent replace: cascade-delete existing courses (edges cascade too),
    // then reinsert. Lets a student re-upload a better scan.
    await admin.from("courses").delete().eq("sheet_id", sheetId);
    await admin.from("course_edges").delete().eq("sheet_id", sheetId);

    if (courses.length) {
      const rows = courses.map((c) => ({
        sheet_id: sheetId,
        course_key: c.id,
        code: c.code,
        name: c.name,
        name_ar: c.nameAr,
        credits: Math.round(c.credits),
        requirement_group: c.requirementGroup,
        standing: c.standing,
        is_external: c.external,
        prerequisites: c.prerequisites,
        corequisites: c.corequisites,
        also_in: c.alsoIn,
        needs_review: c.needsReview,
        note: c.note,
      }));
      const { error: cErr } = await admin.from("courses").insert(rows);
      if (cErr) return await fail(`Failed to save courses: ${cErr.message}`);
    }

    if (edges.length) {
      const edgeRows = edges.map((e) => ({
        sheet_id: sheetId,
        source_key: e.sourceKey,
        target_key: e.targetKey,
        kind: e.kind,
        is_alternative: e.isAlternative,
      }));
      const { error: eErr } = await admin.from("course_edges").insert(edgeRows);
      if (eErr) return await fail(`Failed to save edges: ${eErr.message}`);
    }

    await admin
      .from("major_sheets")
      .update({
        status: "ready",
        error: null,
        program_name: parsed.data.program,
        total_credits: parsed.data.totalCredits,
        warnings,
        raw_extraction: parsed.data,
      })
      .eq("id", sheetId);

    return json({ status: "ready", courses: courses.length, edges: edges.length, warnings });
  } catch (err) {
    return await fail(err instanceof Error ? err.message : "Unexpected extraction error");
  }
});
