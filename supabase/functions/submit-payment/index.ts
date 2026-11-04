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

const PLAN_PRICES = new Map([
  ["pro", 2800],
  ["agency", 7000],
]);
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const TRANSACTION_ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

    const form = await req.formData();
    const plan = String(form.get("plan") ?? "");
    const transactionId = String(form.get("transactionId") ?? "").trim();
    const screenshot = form.get("screenshot");

    const amountPkr = PLAN_PRICES.get(plan);
    if (amountPkr === undefined) return json({ error: "Choose a valid plan." }, 400);
    if (!TRANSACTION_ID_PATTERN.test(transactionId)) {
      return json({ error: "Enter a valid transaction ID." }, 400);
    }
    if (
      !(screenshot instanceof File) ||
      !screenshot.type.startsWith("image/") ||
      screenshot.size === 0 ||
      screenshot.size > MAX_SCREENSHOT_BYTES
    ) {
      return json({ error: "Upload a receipt image under 5 MB." }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const id = crypto.randomUUID();
    const { error: uploadError } = await supabase.storage
      .from("payment-screenshots")
      .upload(id, screenshot, { contentType: screenshot.type, upsert: false });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("payment_requests").insert({
      id,
      plan,
      amount_pkr: amountPkr,
      transaction_id: transactionId,
      screenshot_path: id,
    });
    if (insertError) {
      await supabase.storage.from("payment-screenshots").remove([id]);
      throw insertError;
    }

    return json({ ok: true, id });
  } catch (error) {
    console.error("submit-payment failed", error);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
