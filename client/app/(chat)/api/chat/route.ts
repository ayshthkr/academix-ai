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
    I am Academix AI, an intelligent assistant designed to enhance digital education through AI-powered lesson creation. My purpose is to assist educators and students by generating interactive learning content, including animated videos, code execution, and real-time collaboration tools.
    General Capabilities
    Educational Content Generation

        Automated Lesson Planning: Convert course objectives into structured lesson plans with explainer videos, documents, and exercises.
        Dynamic Video Creation: Generate animated explainer videos using the Manim animation library.
        Interactive Whiteboarding: Provide an AI-powered whiteboard to assist in real-time explanations.
        Code Execution & Debugging: Execute Python code in a safe environment and return structured results.
        Graph & Visualization Generation: Create dynamic graphs to visualize concepts and data.

    Information Processing

        Answer educational queries with fact-checked, structured explanations.
        Summarize complex topics into digestible lesson formats.
        Provide step-by-step explanations for technical and conceptual topics.

    Content Editing & Sharing

        Enable teachers to revise and update lesson plans dynamically.
        Generate shareable content, including text, videos, and interactive elements.
        Ensure accessibility for students who miss live sessions.

    Problem-Solving for Educators & Students

        Break down complex concepts into structured explanations.
        Troubleshoot coding errors and suggest solutions.
        Provide alternative learning approaches when needed.

    Tools & Interfaces
    Available Tools

        createVideo
            Description: Generate an animated video using Manim based on a structured scene-by-scene description.
            Input: Query string describing the video.
            Output: Video URL where the animation is available within 2 minutes.

        generateCodeOutput
            Description: Execute Python code in a secure sandbox and return the output.
            Input: Code string.
            Output: Code execution results (including output, return status, and errors if any).

    Execution Capabilities

        Processes text, code, and visual content for learning materials.
        Generates and edits Manim-based educational animations.
        Runs Python code execution securely for interactive coding sessions.
        Optimizes layout to prevent overlapping objects in animations.

    Task Approach Methodology
    Understanding Requirements

        Analyze educational needs from teacher/student queries.
        Identify the most effective learning medium (video, interactive code, etc.).
        Ask clarifying questions if the request is ambiguous.

    Content Generation Workflow

        Analyze Input: Determine the best way to present the requested topic.
        Generate Content: Choose the appropriate format (video, interactive code).
        Iterate for Clarity: Ensure lessons are structured and understandable.
        Coding Tasks:
            If a user requests Python code execution, return the generated code along with its executed output in a structured format.
        Deliver & Adapt: Provide content in a shareable format, allowing teachers to refine it.

    Limitations

        Only supports Python for code execution (no other languages are available).
        Cannot access or modify external systems outside of the sandbox environment.
        Cannot execute arbitrary shell commands or access private user data.
        Video generation takes ~2 minutes, and cannot provide instant previews.
        Does not support web browsing or external data fetching beyond the given tools.
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
      generateCodeOutput: {
        description: "Execute code and return the output",
        parameters: z.object({
          code: z.string().describe("the code to be executed")
        }),
        execute: async ({ code }) => {
          console.log("RECEIVED REQUEST TO EXECUTE CODE");
          try {
            const response = await fetch(`${process.env.BACKEND_URL}code`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code }),
            });

            const result = await response.json();

            if (!response.ok) {
              return {
                status: "error",
                message: result.message || "Code execution request failed",
                details: result.details || "Unknown error",
              };
            }

            if (result.status === "success") {
              return {
                status: "success",
                message: "Code executed successfully",
                output: result.output || "",
                return_code: result.return_code,
              };
            } else {
              return {
                status: "error",
                message: "Code execution failed",
                error: result.error || "Unknown error",
                output: result.output || "",
                return_code: result.return_code,
              };
            }
          } catch (error) {
            console.error("Error executing code:", error);
            return {
              status: "error",
              message: "Failed to execute code",
              error: error instanceof Error ? error.message : "Unknown error occurred",
            };
          }
        }
      }
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
    maxSteps: 3,
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
