import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_CLIPS_PER_REQUEST = 20;

type IncomingClip = {
  title: unknown;
  emoji: unknown;
  viralScore: unknown;
  durationSeconds: unknown;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

    const body = (await req.json()) as { clips?: unknown };
    if (!Array.isArray(body.clips) || body.clips.length === 0) {
      return json({ error: "No clips to save." }, 400);
    }
    if (body.clips.length > MAX_CLIPS_PER_REQUEST) {
      return json({ error: "Too many clips in one request." }, 400);
    }

    const rows = [];
    for (const raw of body.clips as IncomingClip[]) {
      const title = typeof raw?.title === "string" ? raw.title.trim() : "";
      const emoji = typeof raw?.emoji === "string" ? raw.emoji.slice(0, 8) : "";
      const viralScore = Number(raw?.viralScore);
      const durationSeconds = Number(raw?.durationSeconds);
      if (!title || title.length > 200) return json({ error: "Each clip needs a title." }, 400);
      if (!Number.isInteger(viralScore) || viralScore < 0 || viralScore > 100) {
        return json({ error: "Invalid viral score." }, 400);
      }
      if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
        return json({ error: "Invalid clip length." }, 400);
      }
      rows.push({ title, emoji, viral_score: viralScore, duration_seconds: durationSeconds });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { error } = await supabase.from("clips").insert(rows);
    if (error) throw error;

    return json({ ok: true, saved: rows.length });
  } catch (error) {
    console.error("save-clips failed", error);
    return json({ error: "Could not save clips." }, 500);
  }
});
