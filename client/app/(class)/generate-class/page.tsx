"use client";

import { useState } from "react";
import { generateWeekPlans } from "@/app/actions";
import { WeekPlan, Topic } from "@/app/types";
import ClassForm, { FormValues } from "./components/ClassForm";
import WeekPlanList from "./components/WeekPlanList";
import {
  addWeekAtPosition,
  addTopicToWeek as addTopic,
  updateTopicInWeek as updateTopic,
  deleteTopicFromWeek as deleteTopic,
  updateWeekContent as updateWeek,
  deleteWeek as removeWeek,
  reorderTopicsInWeek
} from "./lib/week-plans";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Save, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [weekPlans, setWeekPlans] = useState<WeekPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedClassId, setSavedClassId] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setIsGenerating(true);
    setError(null);
    setSavedClassId(null);

    try {
      // Generate week plans using AI
      const result = await generateWeekPlans(values);

      if (result.success && result.weekPlans) {
        setWeekPlans(result.weekPlans);

        // After successful generation, save to database
        setIsSaving(true);
        const response = await fetch("/api/class", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classData: {
              ...values,
              duration: parseInt(values.duration) || 10,
            },
            weekPlans: result.weekPlans,
          }),
        });

        const saveResult = await response.json();

        if (saveResult.success) {
          setSavedClassId(saveResult.classId || null);
          toast("Class saved successfully", {
            description:
              "Your class and week plans have been saved to the database.",
          });
        } else {
          toast("Warning", {
            description:
              "Week plans were generated but couldn't be saved: " +
              (saveResult.error || "Unknown error"),
          });
        }
      } else {
        setError(result.error || "Failed to generate week plans");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsGenerating(false);
      setIsSaving(false);
    }
  }

  // Save updated week plans to the database
  async function saveUpdatedPlans() {
    if (!weekPlans.length) return;

    setIsSaving(true);
    try {
      // Get form values directly since we're not in the form submission context
      const response = await fetch("/api/class", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // We don't have form values here, so we would need to store them separately or retrieve them
          weekPlans,
          classId: savedClassId, // Pass the existing class ID for updates
        }),
      });

      const saveResult = await response.json();

      if (saveResult.success) {
        setSavedClassId(saveResult.classId || null);
        toast("Changes saved", {
          description: "Your updated class and week plans have been saved.",
        });
      } else {
        toast("Error saving changes", {
          description: saveResult.error || "Unknown error occurred",
        });
      }
    } catch (err) {
      console.error(err);
      toast("Error saving changes", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Wrap the utility functions to use setState
  const addNewWeek = (position: number) => {
    setWeekPlans(weekPlans => addWeekAtPosition(weekPlans, position));
  };

  const addTopicToWeek = (weekId: string) => {
    setWeekPlans(weekPlans => addTopic(weekPlans, weekId));
  };

  const updateTopicInWeek = (
    weekId: string,
    topicId: string,
    field: keyof Topic,
    value: string
  ) => {
    setWeekPlans(weekPlans => updateTopic(weekPlans, weekId, topicId, field, value));
  };

  const deleteTopicFromWeek = (weekId: string, topicId: string) => {
    setWeekPlans(weekPlans => deleteTopic(weekPlans, weekId, topicId));
  };

  const updateWeekContent = (id: string, field: keyof WeekPlan, value: any) => {
    setWeekPlans(weekPlans => updateWeek(weekPlans, id, field, value));
  };

  const deleteWeek = (id: string) => {
    setWeekPlans(weekPlans => removeWeek(weekPlans, id));
  };

  // Add new function for topic reordering
  const reorderTopics = (weekId: string, topics: Topic[]) => {
    setWeekPlans(weekPlans => reorderTopicsInWeek(weekPlans, weekId, topics));
  };

  return (
    <div className="flex flex-col pb-20 min-h-dvh bg-background py-10 md:py-20">
      <div className="container max-w-4xl py-8 mx-auto">
        <h1 className="text-3xl font-bold mb-6">Generate Class Plan</h1>

        <ClassForm onSubmit={onSubmit} isGenerating={isGenerating} isSaving={isSaving} error={error} />

        {weekPlans.length > 0 && (
          <div className="mt-12">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">Week-by-Week Plan</h2>
              <div className="flex gap-2">
                {savedClassId && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/class/${savedClassId}`)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="size-4" />
                    View Class
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => addNewWeek(0)}
                  className="flex items-center gap-2"
                >
                  <PlusCircle className="size-4" />
                  Add First Week
                </Button>
                <Button
                  variant="secondary"
                  onClick={saveUpdatedPlans}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            <WeekPlanList
              weekPlans={weekPlans}
              setWeekPlans={setWeekPlans}
              addNewWeek={addNewWeek}
              addTopicToWeek={addTopicToWeek}
              updateTopicInWeek={updateTopicInWeek}
              deleteTopicFromWeek={deleteTopicFromWeek}
              updateWeekContent={updateWeekContent}
              deleteWeek={deleteWeek}
              reorderTopics={reorderTopics}
              savedClassId={savedClassId}
              saveUpdatedPlans={saveUpdatedPlans}
              isSaving={isSaving}
            />
          </div>
        )}
      </div>
    </div>
  );
}
