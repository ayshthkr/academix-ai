import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  // Generate a random ID for the chat session
  const randomId = uuidv4();

  // Redirect to the chat page with the random ID
  redirect(`/chat/${randomId}`);

  // This content won't be displayed due to the redirect
  // but it's needed to satisfy TypeScript return type
  return null;
}
