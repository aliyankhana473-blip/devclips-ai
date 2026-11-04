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

const ADMIN_KEY = "786";
const SIGNED_URL_SECONDS = 60 * 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdminBody = {
  key?: unknown;
  action?: unknown;
  id?: unknown;
  decision?: unknown;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Not found." }, 404);

    const body = (await req.json()) as AdminBody;
    if (body.key !== ADMIN_KEY) return json({ error: "Not found." }, 404);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (body.action === "overview") {
      const { data: approved, error: approvedError } = await supabase
        .from("payment_requests")
        .select("amount_pkr")
        .eq("status", "approved");
      if (approvedError) throw approvedError;

      const { data: pending, error: pendingError } = await supabase
        .from("payment_requests")
        .select("id, plan, amount_pkr, transaction_id, screenshot_path, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (pendingError) throw pendingError;

      const { data: clips, error: clipsError } = await supabase
        .from("clips")
        .select("id, title, emoji, viral_score, duration_seconds, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (clipsError) throw clipsError;

      const screenshotPaths = pending.map((row) => row.screenshot_path).filter(Boolean) as string[];
      const signedUrls = new Map<string, string>();
      if (screenshotPaths.length > 0) {
        const { data: signed, error: signedError } = await supabase.storage
          .from("payment-screenshots")
          .createSignedUrls(screenshotPaths, SIGNED_URL_SECONDS);
        if (signedError) throw signedError;
        for (const entry of signed) {
          if (entry.path && entry.signedUrl) signedUrls.set(entry.path, entry.signedUrl);
        }
      }

      return json({
        totalRevenuePkr: approved.reduce((sum, row) => sum + row.amount_pkr, 0),
        approvedCount: approved.length,
        pending: pending.map((row) => ({
          id: row.id,
          plan: row.plan,
          amountPkr: row.amount_pkr,
          transactionId: row.transaction_id,
          screenshotUrl: row.screenshot_path ? signedUrls.get(row.screenshot_path) ?? null : null,
          createdAt: row.created_at,
        })),
        clips: clips.map((row) => ({
          id: row.id,
          title: row.title,
          emoji: row.emoji,
          viralScore: row.viral_score,
          durationSeconds: Number(row.duration_seconds),
          createdAt: row.created_at,
        })),
      });
    }

    if (body.action === "review") {
      const decision = body.decision;
      if (typeof body.id !== "string" || !UUID_PATTERN.test(body.id)) {
        return json({ error: "Invalid payment." }, 400);
      }
      if (decision !== "approved" && decision !== "rejected") {
        return json({ error: "Invalid decision." }, 400);
      }

      const { data, error } = await supabase
        .from("payment_requests")
        .update({ status: decision, reviewed_at: new Date().toISOString() })
        .eq("id", body.id)
        .eq("status", "pending")
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        return json({ error: "This payment was already reviewed." }, 409);
      }

      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error("admin failed", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
