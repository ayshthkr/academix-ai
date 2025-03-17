import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
      <p className="text-center text-muted-foreground mb-6 max-w-md">
        You don&apos;t have access to view this class. You may need to join the class first.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.push("/")}>
          Go Home
        </Button>
        <Button onClick={() => router.push("/classes")}>
          View My Classes
        </Button>
      </div>
    </div>
  );
}
