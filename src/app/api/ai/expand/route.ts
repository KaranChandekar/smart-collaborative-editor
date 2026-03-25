import { generateText } from "ai";
import { aiModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { text } = await req.json();

  const { text: expanded } = await generateText({
    model: aiModel,
    prompt: `Expand on the following text with more detail and explanation. Keep the same style and tone. Return only the expanded text:\n\n${text}`,
    maxOutputTokens: 500,
  });

  return Response.json({ expanded: expanded.trim() });
}
