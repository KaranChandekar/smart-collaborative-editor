import { streamText, convertToModelMessages } from "ai";
import { aiModel } from "@/lib/ai";

export async function POST(req: Request) {
  const { messages, documentContent } = await req.json();

  const result = streamText({
    model: aiModel,
    system: `You are an AI writing assistant. The user is working on this document:

---
${documentContent}
---

Help them with questions about the document, suggest improvements, brainstorm ideas, or help with any writing task. Be concise and helpful.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
