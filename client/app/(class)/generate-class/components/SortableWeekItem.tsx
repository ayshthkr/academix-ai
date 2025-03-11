"use client";

import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PlusCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WeekPlan, Topic } from "@/app/types";
import SortableTopicItem from "./SortableTopicItem";
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
  useSortable
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface SortableWeekItemProps {
  week: WeekPlan;
  updateWeekContent: (id: string, field: keyof WeekPlan, value: any) => void;
  deleteWeek: (id: string) => void;
  addNewWeek: () => void;
  addTopicToWeek: (weekId: string) => void;
  updateTopicInWeek: (weekId: string, topicId: string, field: keyof Topic, value: string) => void;
  deleteTopicFromWeek: (weekId: string, topicId: string) => void;
  reorderTopics: (weekId: string, topics: Topic[]) => void;
}

export default function SortableWeekItem({
  week,
  updateWeekContent,
  deleteWeek,
  addNewWeek,
  addTopicToWeek,
  updateTopicInWeek,
  deleteTopicFromWeek,
  reorderTopics
}: SortableWeekItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: week.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(false);

  // Set up sensors for topic drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Prevent conflicts with text selection
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle topic drag end
  const handleTopicDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && week.topics) {
      const oldIndex = week.topics.findIndex(topic => topic.id === active.id);
      const newIndex = week.topics.findIndex(topic => topic.id === over.id);

      const reorderedTopics = arrayMove(week.topics, oldIndex, newIndex);
      reorderTopics(week.id, reorderedTopics);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border bg-card text-card-foreground"
    >
      <div className="flex items-center p-3 border-b">
        <div
          {...attributes}
          {...listeners}
          className="mr-3 cursor-move touch-none flex items-center"
        >
          <GripVertical className="size-5 text-muted-foreground" />
        </div>

        {isEditing ? (
          <Input
            value={week.title}
            onChange={(e) =>
              updateWeekContent(week.id, "title", e.target.value)
            }
            className="font-semibold"
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <h3
            className="font-semibold text-lg grow cursor-pointer hover:text-primary"
            onClick={() => setIsEditing(true)}
          >
            {week.title}
          </h3>
        )}
      </div>

      <div className="p-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTopicDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={week.topics?.map(topic => topic.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {week.topics?.map((topic) => (
                <SortableTopicItem
                  key={topic.id}
                  topic={topic}
                  weekId={week.id}
                  updateTopicInWeek={updateTopicInWeek}
                  deleteTopicFromWeek={deleteTopicFromWeek}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => addTopicToWeek(week.id)}
          >
            <Plus className="size-3.5 mr-1" /> Add Topic
          </Button>
        </div>
      </div>

      <div className="p-3 bg-muted/30 flex justify-between">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteWeek(week.id)}
        >
          Delete Week
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={addNewWeek}
          className="flex items-center gap-1"
        >
          <PlusCircle className="size-3" />
          Add Week After
        </Button>
      </div>
    </div>
  );
}
