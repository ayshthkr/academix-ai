import { FileText, ListChecks, BookOpen, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Topic } from "@/app/types";

interface TopicItemProps {
  topic: Topic;
  weekId: string;
  updateTopicInWeek: (weekId: string, topicId: string, field: keyof Topic, value: string) => void;
  deleteTopicFromWeek: (weekId: string, topicId: string) => void;
}

export default function TopicItem({
  topic,
  weekId,
  updateTopicInWeek,
  deleteTopicFromWeek,
}: TopicItemProps) {
  // Get icon based on topic type
  const getTopicIcon = (type: string) => {
    switch (type) {
      case 'lecture':
      case 'content':
        return <FileText className="size-4" />;
      case 'assignment':
        return <ListChecks className="size-4" />;
      case 'reading':
        return <BookOpen className="size-4" />;
      case 'discussion':
        return <MessageSquare className="size-4" />;
      default:
        return <FileText className="size-4" />;
    }
  };

  return (
    <div className="border rounded-md p-2 bg-muted/20">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          {getTopicIcon(topic.type)}
          <div className="font-medium text-sm capitalize">{topic.type}</div>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0"
            onClick={() => deleteTopicFromWeek(weekId, topic.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-1">
        <Input
          value={topic.title}
          onChange={(e) =>
            updateTopicInWeek(weekId, topic.id, "title", e.target.value)
          }
          className="font-medium text-sm h-8"
          placeholder="Topic title"
        />
      </div>

      <div>
        <Textarea
          value={topic.description}
          onChange={(e) =>
            updateTopicInWeek(weekId, topic.id, "description", e.target.value)
          }
          className="min-h-[60px] text-sm border-none resize-none p-0"
          placeholder="Topic description..."
        />
      </div>
    </div>
  );
}
