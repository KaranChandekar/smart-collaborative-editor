import { generateText } from "ai";
import { aiModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { text, mode } = await req.json();

  const prompts: Record<string, string> = {
    grammar: `Fix grammar and spelling errors in this text. Return only the corrected text, nothing else:\n\n${text}`,
    tone: `Improve the tone of this text to be more professional and clear. Return only the improved text:\n\n${text}`,
    clarity: `Rewrite this text to be clearer and more concise. Return only the improved text:\n\n${text}`,
    shorten: `Shorten this text while keeping the key points. Return only the shortened text:\n\n${text}`,
  };

  const { text: improved } = await generateText({
    model: aiModel,
    prompt: prompts[mode] || prompts.grammar,
    maxOutputTokens: 500,
  });

  return Response.json({ improved: improved.trim() });
}
