"use client";

import { PlusCircle, Save, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekPlan, Topic } from "@/app/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableWeekItem from "./SortableWeekItem";
import { useState } from "react";
import { toast } from "sonner";

interface WeekPlanListProps {
  weekPlans: WeekPlan[];
  setWeekPlans: React.Dispatch<React.SetStateAction<WeekPlan[]>>;
  addNewWeek: (position: number) => void;
  savedClassId: string | null;
  saveUpdatedPlans: () => Promise<void>;
  isSaving: boolean;
  addTopicToWeek: (weekId: string) => void;
  updateTopicInWeek: (weekId: string, topicId: string, field: keyof Topic, value: string) => void;
  deleteTopicFromWeek: (weekId: string, topicId: string) => void;
  updateWeekContent: (id: string, field: keyof WeekPlan, value: any) => void;
  deleteWeek: (id: string) => void;
  reorderTopics: (weekId: string, topics: Topic[]) => void;
}

export default function WeekPlanList({
  weekPlans,
  setWeekPlans,
  addNewWeek,
  savedClassId,
  saveUpdatedPlans,
  isSaving,
  addTopicToWeek,
  updateTopicInWeek,
  deleteTopicFromWeek,
  updateWeekContent,
  deleteWeek,
  reorderTopics
}: WeekPlanListProps) {
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWeekPlans((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const copyClassId = async () => {
    if (!savedClassId) return;

    try {
      await navigator.clipboard.writeText(savedClassId);
      setCopied(true);
      toast("Class ID copied", {
        description: "Class ID copied to clipboard"
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy class ID", err);
    }
  };

  return (
    <div className="mt-4">
      {savedClassId && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Class saved successfully!</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono bg-white/60 px-2 py-1 rounded text-sm">
                  {savedClassId}
                </span>
                <span className="text-xs text-green-700">
                  ← Remember this ID to share or access your class
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyClassId}
              className="h-8"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
            </Button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={weekPlans.map((week) => week.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {weekPlans.map((week, index) => (
              <SortableWeekItem
                key={week.id}
                week={week}
                updateWeekContent={updateWeekContent}
                deleteWeek={deleteWeek}
                addNewWeek={() => addNewWeek(index + 1)}
                addTopicToWeek={addTopicToWeek}
                updateTopicInWeek={updateTopicInWeek}
                deleteTopicFromWeek={deleteTopicFromWeek}
                reorderTopics={reorderTopics}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
