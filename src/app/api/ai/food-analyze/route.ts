import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

// Vision models in order of preference — fallback if primary is unavailable
const VISION_MODELS = [
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview",
  "meta-llama/llama-4-scout-17b-16e-instruct",
];

const PROMPT = `You are a nutrition expert AI. Look at the food in this image and analyze it.
Respond ONLY with a raw JSON object (no markdown, no code block, no extra text):
{"name":"Food name in English","calories":350,"protein":15.5,"carbs":45.0,"fat":10.2,"weight":200,"description":"One sentence about the dish"}
Estimate numeric values for the visible portion. If the image contains no food at all, respond: {"error":"No food detected in this image"}`;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "AI not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { image?: string; mimeType?: string };
  const { image, mimeType = "image/jpeg" } = body;

  if (!image) {
    return NextResponse.json({ message: "No image provided." }, { status: 400 });
  }

  const groq = new Groq({ apiKey });

  for (const model of VISION_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${image}` },
              } as never,
              { type: "text", text: PROMPT },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      const text = (completion.choices[0]?.message?.content ?? "").trim();

      // Greedy match — captures the full outermost JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Model responded with non-JSON text — try next model
        continue;
      }

      let data: Record<string, unknown>;
      try {
        data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      } catch {
        continue;
      }

      // Return 200 in all cases so Dio doesn't throw on the client
      // The Flutter side checks for the "error" field
      return NextResponse.json(data);
    } catch (err: unknown) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as { status: number }).status
          : 0;

      if (status === 429) {
        return NextResponse.json(
          { message: "Too many requests — please wait and try again." },
          { status: 429 }
        );
      }

      // Any other error — try the next model
      console.error(`Vision model ${model} failed:`, err);
      continue;
    }
  }

  return NextResponse.json(
    { message: "All vision models failed. Please try again." },
    { status: 502 }
  );
}
