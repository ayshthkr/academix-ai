import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";
import { geminiFlashModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import { deleteChatById, getChatById, saveChat } from "@/db/queries";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0
  );

  const result = await streamText({
    model: geminiFlashModel,
    system: `\n
      You are a helpful assistant who can generate animated videos using Manim animation library.
      You can help users create animated videos on receiving a query.
      You return the url of the video generated
      `,
    messages: coreMessages,
    tools: {
      createVideo: {
        description: "Create an animated video using Manim animation library",
        parameters: z.object({
          query: z
            .string()
            .describe("a structured scene by scene description of the video"),
        }),
        execute: async ({ query }) => {
          console.log("RECEIVED REQUEST TO CREATE VIDEO for query: ", query);
          const randomId = Math.random().toString(36).substring(7);
          fetch(process.env.BACKEND_URL + "query", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query,
              filename: `${id.replaceAll("-", "_")}_${randomId}`,
            }),
          });
          console.log("SENT REQUEST TO BACKEND for query: ", query);
          // Return a structured object instead of a string
          return {
            videoUrl: `${process.env.BACKEND_URL}videos/${id.replaceAll(
              "-",
              "_"
            )}_${randomId}`,
            message: "Video generated successfully",
          };
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
