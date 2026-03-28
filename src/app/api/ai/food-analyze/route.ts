import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

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

  try {
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${image}` },
            } as never,
            {
              type: "text",
              text: `You are a nutrition expert. Analyze the food in this image.
Respond ONLY with a valid JSON object, no markdown, no extra text:
{"name":"Food name","calories":350,"protein":15.5,"carbs":45.0,"fat":10.2,"weight":200,"description":"One sentence description"}
Estimate all values for the visible portion size. If there is no food in the image, return: {"error":"No food detected"}`,
            },
          ],
        },
      ],
      max_tokens: 256,
      temperature: 0.1,
    });

    const text = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      return NextResponse.json({ message: "Could not parse AI response." }, { status: 502 });
    }

    const data = JSON.parse(jsonMatch[0]) as { error?: string; [key: string]: unknown };

    if (data.error) {
      return NextResponse.json({ message: data.error }, { status: 422 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Vision AI error:", err);
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? (err as { status: number }).status
        : 502;
    const message =
      status === 429
        ? "Too many requests — please wait and try again."
        : "AI service error. Please try again.";
    return NextResponse.json({ message }, { status: status === 429 ? 429 : 502 });
  }
}
