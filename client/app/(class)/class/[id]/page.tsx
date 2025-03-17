import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClassDetails from "./ClassDetails";

export default function ClassPage() {
  return (
    <div className="flex flex-col pb-20 min-h-dvh bg-background py-10 md:py-20">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-dvh">
            <div className="text-center">
              <Loader2 className="size-8 animate-spin mx-auto mb-4" />
              <p>Loading class details...</p>
            </div>
          </div>
        }
      >
        <ClassDetails showEditButton={true} />
      </Suspense>
    </div>
  );
}
