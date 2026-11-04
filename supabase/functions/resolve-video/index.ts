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

    // Call Cobalt API to resolve a direct stream URL for the YouTube video.
    const cobaltResponse = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ url: inputUrl, downloadMode: "auto", videoQuality: "720" }),
    }).catch(() => null);

    if (!cobaltResponse) {
      return json({ error: "YouTube is busy, try again in 1 min or use Upload MP4." }, 502);
    }

    const cobaltData = await cobaltResponse.json().catch(() => null) as
      | { status: string; url?: string | string[]; text?: string; title?: string }
      | null;

    if (!cobaltData) {
      return json({ error: "YouTube is busy, try again in 1 min or use Upload MP4." }, 502);
    }

    if (cobaltData.status === "error" || cobaltData.status === "rate-limit") {
      return json({ error: "YouTube is busy, try again in 1 min or use Upload MP4." }, 502);
    }

    if ((cobaltData.status === "stream" || cobaltData.status === "redirect") && cobaltData.url) {
      const streamUrl = Array.isArray(cobaltData.url) ? cobaltData.url[0] : cobaltData.url;
      const videoId = host === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
      return json({
        videoUrl: streamUrl,
        title: cobaltData.title ?? `youtube-${videoId ?? "video"}`,
      });
    }

    return json({ error: "YouTube is busy, try again in 1 min or use Upload MP4." }, 502);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return json({ error: message }, 500);
  }
});
