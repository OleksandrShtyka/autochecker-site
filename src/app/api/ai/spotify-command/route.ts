import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GO_API = "https://autochecker-api.fly.dev";

// POST /api/ai/spotify-command
// Body: { prompt: string }
// Returns: { queries: string[] }
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const cookie = req.headers.get("cookie") ?? "";

    const systemMsg = `You are a Spotify playlist generator. Generate exactly 8 Spotify search queries for the given playlist request.
Return ONLY a raw JSON object — no markdown, no explanation, nothing else.
Format: {"queries":["query1","query2","query3","query4","query5","query6","query7","query8"]}
Each query should be a realistic Spotify search term (artist, song title, genre+mood, etc).`;

    const aiBody = JSON.stringify({
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: `Playlist request: ${prompt}` },
      ],
    });

    const goRes = await fetch(`${GO_API}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: aiBody,
    });

    if (!goRes.ok) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const data = await goRes.json();
    const content: string = data?.reply ?? data?.content ?? data?.message ?? "";

    // Try to parse JSON from AI response
    const match = content.match(/\{[\s\S]*?"queries"[\s\S]*?\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed.queries)) {
          return NextResponse.json({ queries: parsed.queries });
        }
      } catch {}
    }

    // Fallback: build queries from prompt words
    const words = prompt.split(/\s+/).filter((w: string) => w.length > 2);
    const fallback = [
      prompt,
      `${prompt} workout`,
      `${prompt} gym`,
      words.length > 0 ? `${words[0]} hits` : "top hits",
      "high energy workout",
      "pump up music",
      "motivation beats",
      "workout playlist",
    ].slice(0, 8);

    return NextResponse.json({ queries: fallback });
  } catch (err) {
    console.error("[spotify-command]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
