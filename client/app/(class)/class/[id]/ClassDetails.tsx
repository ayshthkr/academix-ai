"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WeekPlan } from "@/app/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EnrolledStudentsSheet } from "@/components/enrolled-students-sheet";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ClassData {
  id: string;
  title: string;
  description: string;
  objectives: string;
  duration: number;
  targetAudience: string;
}

interface ClassDetailsProps {
  showEditButton?: boolean;
}

export default function ClassDetails({
  showEditButton = false,
}: ClassDetailsProps) {
  const params = useParams();
  const router = useRouter();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const classId = params.id as string;

  useEffect(() => {
    async function fetchClass() {
      try {
        const response = await fetch(`/api/class?id=${classId}`);
        const data = await response.json();

        if (data.success) {
          setClassData(data.class);
          setWeekPlans(data.weekPlans);
          setUserRole(data.userRole);
        } else {
          setError(data.error || "Failed to load class");
          toast.error("Failed to load class", {
            description: data.error || "Could not find class with this ID",
          });
        }
      } catch (err) {
        console.error("Error fetching class:", err);
        setError("An unexpected error occurred");
        toast.error("Error loading class data");
      } finally {
        setLoading(false);
      }
    }

    fetchClass();
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading class...</p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="container max-w-4xl py-20 mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
        <p className="mb-6">Could not find class with ID: {classId}</p>
        <button
          onClick={() => router.push("/generate-class")}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Create New Class
        </button>
      </div>
    );
  }

  // Check if user is teacher/creator to show management features
  const isTeacherOrCreator = userRole === "teacher" || userRole === "creator";
  const isTeacher = userRole === "teacher" || userRole === "creator";

  return (
    <div className="container max-w-4xl py-10 mx-auto px-4">
      <div className="mb-8">
        <div className="flex items-center flex-wrap gap-4 mb-2">
          <h1 className="text-3xl font-bold break-words">{classData.title}</h1>
          <span className="text-sm bg-gray-100 px-2 py-1 rounded-md font-mono truncate max-w-full">
            {classId}
          </span>
          {userRole && (
            <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-md">
              {userRole === "creator"
                ? "Teacher (Owner)"
                : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          )}
        </div>
        <p className="text-muted-foreground break-words">
          {classData.description}
        </p>
      </div>

      {/* Only show management section to teachers/creators */}
      {isTeacherOrCreator && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Class Management</h2>
          <span className="inline-flex gap-2">
            {showEditButton && isTeacher && (
              <Button asChild variant={'outline'}>
                <Link href={`/class/${classId}/edit`}>Edit Class</Link>
              </Button>
            )}
            <EnrolledStudentsSheet classId={classId} />
          </span>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">Learning Objectives</h2>
        <p className="whitespace-pre-wrap pl-4 overflow-hidden break-words">
          {classData.objectives}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">
            Duration
          </h3>
          <p>{classData.duration} weeks</p>
        </div>
        <div>
          <h3 className="font-medium text-sm text-muted-foreground">
            Target Audience
          </h3>
          <p>{classData.targetAudience}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Weekly Plan</h2>
      <div className="space-y-6">
        {weekPlans.map((week) => (
          <div key={week.id} className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-2 break-words">{week.title}</h3>
            <div className="space-y-3">
              {week.topics?.map((topic) => (
                <div
                  key={topic.id}
                  className="border-l-4 border-primary/50 pl-3 py-1"
                >
                  <h4 className="font-medium break-words">{topic.title}</h4>
                  <p className="text-sm text-muted-foreground break-words">
                    {topic.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
