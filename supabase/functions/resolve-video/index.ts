Deno.serve(async (req: Request) => {
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

  const BUSY_MSG = "YouTube is busy, try again in 1 min or use Upload MP4.";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

    const body = await req.json().catch(() => ({} as { url?: string }));
    const inputUrl = typeof body.url === "string" ? body.url.trim() : "";

    if (!inputUrl) return json({ error: "A video URL is required." }, 400);

    let parsed: URL;
    try {
      parsed = new URL(inputUrl);
    } catch {
      return json({ error: "That doesn't look like a valid URL." }, 400);
    }

    const host = parsed.hostname.toLowerCase();
    const isYouTube =
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be";

    if (!isYouTube) {
      return json({ error: "Only YouTube links are supported by this endpoint." }, 400);
    }

    const videoId = host === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
    const cobaltBody = JSON.stringify({ url: inputUrl, downloadMode: "auto", videoQuality: "720" });
    const cobaltHeaders = { Accept: "application/json", "Content-Type": "application/json" };

    const COBALT_INSTANCES = [
      "https://api.cobalt.tools/api/json",
      "https://co.wuk.sh/api/json",
      "https://cobalt-api.kwiatekmiki.com/api/json",
    ];

    for (const apiUrl of COBALT_INSTANCES) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: cobaltHeaders,
        body: cobaltBody,
        signal: controller.signal,
      }).catch(() => null);
      clearTimeout(timeout);
      if (!res || !res.ok) continue;

      const data = await res.json().catch(() => null) as
        | { status: string; url?: string | string[]; text?: string; title?: string }
        | null;
      if (!data || data.status === "error" || data.status === "rate-limit") continue;

      if ((data.status === "stream" || data.status === "redirect") && data.url) {
        const streamUrl = Array.isArray(data.url) ? data.url[0] : data.url;
        return json({ videoUrl: streamUrl, title: data.title ?? `youtube-${videoId ?? "video"}` });
      }
    }

    // Fallback: Invidious API
    if (videoId) {
      const invidiousRes = await fetch(
        `https://invidious.io/api/v1/videos/${videoId}`,
        { signal: AbortSignal.timeout(8000) },
      ).catch(() => null);

      if (invidiousRes && invidiousRes.ok) {
        const invidiousData = await invidiousRes.json().catch(() => null) as
          | { title?: string; adaptiveFormats?: { url?: string }[] }
          | null;
        const fallbackUrl = invidiousData?.adaptiveFormats?.find((f) => f.url)?.url;
        if (fallbackUrl) {
          return json({ videoUrl: fallbackUrl, title: invidiousData?.title ?? `youtube-${videoId}` });
        }
      }
    }

    return json({ error: BUSY_MSG }, 502);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return json({ error: message }, 500);
  }
});
