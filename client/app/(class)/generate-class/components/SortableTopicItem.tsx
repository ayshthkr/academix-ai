"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import TopicItem from "./TopicItem";
import { Topic } from "@/app/types";

interface SortableTopicItemProps {
  topic: Topic;
  weekId: string;
  updateTopicInWeek: (weekId: string, topicId: string, field: keyof Topic, value: string) => void;
  deleteTopicFromWeek: (weekId: string, topicId: string) => void;
}

export default function SortableTopicItem({
  topic,
  weekId,
  updateTopicInWeek,
  deleteTopicFromWeek,
}: SortableTopicItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-start">
        <div
          {...attributes}
          {...listeners}
          className="mt-2 mr-2 cursor-move touch-none opacity-20 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <TopicItem
            topic={topic}
            weekId={weekId}
            updateTopicInWeek={updateTopicInWeek}
            deleteTopicFromWeek={deleteTopicFromWeek}
          />
        </div>
      </div>
    </div>
  );
}
