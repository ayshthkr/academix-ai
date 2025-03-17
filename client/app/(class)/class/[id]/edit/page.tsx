"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { WeekPlan, Topic } from "@/app/types";
import WeekPlanList from "@/app/(class)/generate-class/components/WeekPlanList";
import {
  addWeekAtPosition,
  addTopicToWeek,
  updateTopicInWeek,
  deleteTopicFromWeek,
  updateWeekContent,
  deleteWeek,
  reorderTopicsInWeek
} from "@/app/(class)/generate-class/lib/week-plans";

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [classData, setClassData] = useState({
    title: "",
    description: "",
    objectives: "",
    duration: 0,
    targetAudience: "",
  });

  // Add state for week plans
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);

  // Get auth session and user role
  useEffect(() => {
    const getSession = async () => {
      try {
        // Fetch user role and permissions
        const classResponse = await fetch(`/api/class?id=${classId}`);
        const data = await classResponse.json();

        if (data.success) {
          const role = data.userRole;

          if (role !== "teacher" && role !== "creator") {
            toast.error("Only teachers can edit class details");
            router.push(`/class/${classId}`);
          }
        }
      } catch (error) {
        toast.error("Failed to verify user permissions");
      }
    };
    getSession();
  }, [classId, router]);

  // Fetch class data
  useEffect(() => {
    async function fetchClassData() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/class?id=${classId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch class data");
        }
        const data = await response.json();

        if (data.success && data.class) {
          setClassData({
            title: data.class.title,
            description: data.class.description,
            objectives: data.class.objectives,
            duration: data.class.duration,
            targetAudience: data.class.targetAudience,
          });

          // Set week plans from the API response
          if (data.weekPlans) {
            setWeekPlans(data.weekPlans);
          }
        } else {
          throw new Error(data.error || "Failed to load class data");
        }
      } catch (error) {
        toast.error("Failed to load class data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchClassData();
  }, [classId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setClassData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Wrap the utility functions to use setState
  const addNewWeek = (position: number) => {
    setWeekPlans(weekPlans => addWeekAtPosition(weekPlans, position));
  };

  const addTopicToWeekHandler = (weekId: string) => {
    setWeekPlans(weekPlans => addTopicToWeek(weekPlans, weekId));
  };

  const updateTopicInWeekHandler = (
    weekId: string,
    topicId: string,
    field: keyof Topic,
    value: string
  ) => {
    setWeekPlans(weekPlans => updateTopicInWeek(weekPlans, weekId, topicId, field, value));
  };

  const deleteTopicFromWeekHandler = (weekId: string, topicId: string) => {
    setWeekPlans(weekPlans => deleteTopicFromWeek(weekPlans, weekId, topicId));
  };

  const updateWeekContentHandler = (id: string, field: keyof WeekPlan, value: any) => {
    setWeekPlans(weekPlans => updateWeekContent(weekPlans, id, field, value));
  };

  const deleteWeekHandler = (id: string) => {
    setWeekPlans(weekPlans => deleteWeek(weekPlans, id));
  };

  const reorderTopicsHandler = (weekId: string, topics: Topic[]) => {
    setWeekPlans(weekPlans => reorderTopicsInWeek(weekPlans, weekId, topics));
  };

  // Save updated plans function for the WeekPlanList component
  const saveUpdatedPlans = async (): Promise<void> => {
    await handleSubmit();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/class/${classId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classData,
          weekPlans
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update class");
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Class updated successfully");
        if (!e) {
          // Only redirect if this was called from the form submit, not from saveUpdatedPlans
          return { success: true };
        }
        router.push(`/class/${classId}`);
      } else {
        throw new Error(result.error || "Failed to update class");
      }

    } catch (error) {
      toast.error("Failed to update class");
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4" />
          <p>Loading class details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 mx-auto">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/class/${classId}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Class
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Edit Class Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Class Title</Label>
              <Input
                id="title"
                name="title"
                value={classData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={classData.description}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objectives">Learning Objectives</Label>
              <Textarea
                id="objectives"
                name="objectives"
                value={classData.objectives}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (weeks)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="1"
                value={classData.duration}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                name="targetAudience"
                value={classData.targetAudience}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/class/${classId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Add week plans editor */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Weekly Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {weekPlans.length > 0 ? (
            <WeekPlanList
              weekPlans={weekPlans}
              setWeekPlans={setWeekPlans}
              addNewWeek={addNewWeek}
              addTopicToWeek={addTopicToWeekHandler}
              updateTopicInWeek={updateTopicInWeekHandler}
              deleteTopicFromWeek={deleteTopicFromWeekHandler}
              updateWeekContent={updateWeekContentHandler}
              deleteWeek={deleteWeekHandler}
              reorderTopics={reorderTopicsHandler}
              savedClassId={classId}
              saveUpdatedPlans={saveUpdatedPlans}
              isSaving={isSaving}
            />
          ) : (
            <div className="text-center py-10">
              <p className="mb-4 text-muted-foreground">No weekly plan content yet.</p>
              <Button
                onClick={() => addNewWeek(0)}
                variant="outline"
              >
                Add First Week
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
