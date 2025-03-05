import { google } from "@ai-sdk/google"
import { type CoreMessage, streamText } from "ai"

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json()

  const result = streamText({
    model: google("gemini-2.0-flash-exp"),
    system: "",
    messages,
  });

  return result.toDataStreamResponse()
}

