Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({} as { url?: string }));
    const inputUrl = typeof body.url === "string" ? body.url.trim() : "";

    if (!inputUrl) {
      return new Response(
        JSON.stringify({ error: "A video URL is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(inputUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "That doesn't look like a valid URL." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const host = parsed.hostname.toLowerCase();
    const isYouTube =
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be";

    if (!isYouTube) {
      return new Response(
        JSON.stringify({ error: "Only YouTube links are supported by this endpoint." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use the cobalt API to resolve a direct media URL for the YouTube video.
    // cobalt is an open-source media resolver. The public API base can be
    // overridden via the COBALT_API_URL secret if a self-hosted instance is used.
    const cobaltBase = Deno.env.get("COBALT_API_URL") ?? "https://api.cobalt.tools";
    const cobaltResponse = await fetch(`${cobaltBase}/api/json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ url: inputUrl }),
    });

    if (!cobaltResponse.ok) {
      const errText = await cobaltResponse.text().catch(() => "");
      return new Response(
        JSON.stringify({
          error:
            "We couldn't resolve this YouTube video. It may be private, age-restricted, or unavailable. Try uploading the MP4 file instead.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cobaltData = await cobaltResponse.json().catch(() => null) as
      | { status: string; url?: string | string[]; text?: string }
      | null;

    if (!cobaltData || cobaltData.status !== "stream" || !cobaltData.url) {
      return new Response(
        JSON.stringify({
          error:
            cobaltData?.text ??
            "We couldn't get a downloadable stream for this YouTube video. Try uploading the MP4 file instead.",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const streamUrl = Array.isArray(cobaltData.url) ? cobaltData.url[0] : cobaltData.url;

    // Fetch the actual video bytes from the resolved stream URL.
    const videoResponse = await fetch(streamUrl);
    if (!videoResponse.ok) {
      return new Response(
        JSON.stringify({ error: "We couldn't download the video file. Try again or upload the MP4." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const MAX_BYTES = 500 * 1024 * 1024;
    const contentLength = videoResponse.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "This video is larger than 500 MB. Try a shorter or smaller video." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    if (videoBuffer.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: "This video is larger than 500 MB. Try a shorter or smaller video." }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Derive a filename from the video id.
    const videoId = host === "youtu.be" ? parsed.pathname.slice(1) : parsed.searchParams.get("v");
    const filename = `youtube-${videoId ?? "video"}.mp4`;

    return new Response(videoBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": videoBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
