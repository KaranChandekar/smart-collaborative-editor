import { generateText } from "ai";
import { aiModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { context } = await req.json();

  const { text } = await generateText({
    model: aiModel,
    prompt: `Continue this text naturally. Write 1-2 sentences max. Do not repeat what's already written. Just continue from where it left off.

Text so far:
${context}

Continue:`,
    maxOutputTokens: 100,
  });

  return Response.json({ suggestion: text.trim() });
}
