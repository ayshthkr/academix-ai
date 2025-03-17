"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";

import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { VideoMessage } from "./video-message";
import CircularLoader from "./loader";

// Check if content contains a localhost:5000 URL
const extractLocalhostUrl = (content: string): string | null => {
  const urlRegex = /(http:\/\/localhost:5000[^\s"]+)/g;
  const match = content.match(urlRegex);
  return match ? match[0] : null;
};

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
  isLoading = false,
}: {
  chatId: string;
  role: string;
  content: string;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  isLoading?: boolean;
}) => {
  // Extract localhost:5000 URL if present
  const videoUrl = extractLocalhostUrl(content);

  // If we have a localhost:5000 URL, render the VideoMessage component
  if (videoUrl) {
    return (
      <div className={`flex justify-${role === "user" ? "end" : "start"} w-full max-w-4xl mx-auto`}>
        <VideoMessage url={videoUrl} />
      </div>
    );
  }

  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {isLoading ? (
          <div className="text-zinc-800 dark:text-zinc-300 flex items-center">
            {/* <div className="h-6 w-6 rounded-full border-2 border-t-transparent border-zinc-500 animate-spin"></div> */}
            <CircularLoader />
          </div>
        ) : (
          <>
            {content && typeof content === "string" && (
              <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
                <Markdown>{content}</Markdown>
              </div>
            )}

            {toolInvocations && (
              <div className="flex flex-col gap-4">
                {toolInvocations.map((toolInvocation) => {
                  const { toolName, toolCallId, state } = toolInvocation;

                  if (state === "result") {
                    const { result } = toolInvocation;
                    return (
                      <div key={toolCallId} className="text-sm p-4 bg-gray-50 dark:bg-zinc-800 rounded-md overflow-auto">
                        <p className="font-medium mb-2">{toolName}</p>
                        <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
                      </div>
                    );
                  } else {
                    return (
                      <div key={toolCallId} className="skeleton p-4 bg-gray-50 dark:bg-zinc-800 rounded-md">
                        <p className="font-medium mb-2">{toolName}</p>
                        <div className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-700 animate-pulse rounded"></div>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {attachments && (
              <div className="flex flex-row gap-2">
                {attachments.map((attachment) => (
                  <PreviewAttachment key={attachment.url} attachment={attachment} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
