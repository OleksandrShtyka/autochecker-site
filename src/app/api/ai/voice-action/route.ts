import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { transcript } = (await req.json()) as { transcript?: string };
    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ message: "Empty transcript" }, { status: 400 });
    }

    const systemPrompt = `You are a fitness logging assistant. The user speaks Ukrainian or English.
Extract workout data from the transcript and return ONLY a JSON object with these fields:
- workoutType: string (e.g. "bench press", "squat", "deadlift", "running", "жим лежачи")
- durationMin: number (duration in minutes, estimate if not stated)
- volumeKg: number (total weight × reps in kg, or 0 if cardio)
- exercises: array of strings (list of exercises mentioned)
- notes: string (any extra info)

Respond ONLY with valid JSON. No markdown, no explanation.`;

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", err);
      return NextResponse.json({ message: "AI error" }, { status: 502 });
    }

    const groqData = (await groqRes.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = groqData.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from any surrounding text
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    // Normalise field types
    const sessionData = {
      workoutType: String(parsed.workoutType ?? "Unknown"),
      durationMin: Number(parsed.durationMin ?? 0),
      volumeKg: Number(parsed.volumeKg ?? 0),
      exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      notes: String(parsed.notes ?? transcript),
    };

    return NextResponse.json(sessionData);
  } catch (err) {
    console.error("voice-action error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
