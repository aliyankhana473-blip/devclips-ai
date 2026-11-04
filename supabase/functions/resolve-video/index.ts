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

    if (!inputUrl) {
      return json({ error: "A video URL is required." }, 400);
    }

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

    // 1. Validate the video exists and is embeddable via noembed.
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(inputUrl)}`;
    const noembedResponse = await fetch(noembedUrl).catch(() => null);

    if (!noembedResponse || !noembedResponse.ok) {
      return json({
        error:
          "We couldn't verify this YouTube video. It may be private, deleted, or restricted. Please use Upload MP4 instead.",
      }, 502);
    }

    const noembedData = await noembedResponse.json().catch(() => null) as
      | { title?: string; error?: string }
      | null;

    if (!noembedData || noembedData.error) {
      return json({
        error:
          "This YouTube video could not be found or is not embeddable. Please use Upload MP4 instead.",
      }, 502);
    }

    // 2. Video is valid, but YouTube blocks direct server-side downloads.
    //    Return a clear, actionable message guiding users to Upload MP4.
    return json({
      error: "YouTube blocked direct fetch. Please use Upload MP4.",
    }, 502);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return json({ error: message }, 500);
  }
});
