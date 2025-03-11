import { WeekPlan, Topic } from "@/app/types";

// Add a new week at the specified position
export function addWeekAtPosition(
  weekPlans: WeekPlan[],
  position: number
): WeekPlan[] {
  const newId = `week-${Date.now()}`;
  const newWeek: WeekPlan = {
    id: newId,
    weekNumber: position + 1,
    title: `Week ${position + 1}: New Week`,
    topics: [
      {
        id: `topic-${Date.now()}-1`,
        type: "content",
        title: "New Content",
        description: "Add your content here...",
      },
    ],
  };

  const updatedWeeks = [...weekPlans];
  updatedWeeks.splice(position, 0, newWeek);

  // Update week numbers
  return updatedWeeks.map((week, idx) => ({
    ...week,
    weekNumber: idx + 1,
  }));
}

// Add a topic to a specific week
export function addTopicToWeek(
  weekPlans: WeekPlan[],
  weekId: string
): WeekPlan[] {
  return weekPlans.map((week) => {
    if (week.id === weekId) {
      const newTopic: Topic = {
        id: `topic-${Date.now()}-${week.topics?.length || 0 + 1}`,
        type: "content",
        title: "New Topic",
        description: "Add your content here...",
      };
      return {
        ...week,
        topics: [...(week.topics || []), newTopic],
      };
    }
    return week;
  });
}

// Update a specific topic in a week
export function updateTopicInWeek(
  weekPlans: WeekPlan[],
  weekId: string,
  topicId: string,
  field: keyof Topic,
  value: string
): WeekPlan[] {
  return weekPlans.map((week) => {
    if (week.id === weekId && week.topics) {
      return {
        ...week,
        topics: week.topics.map((topic) =>
          topic.id === topicId ? { ...topic, [field]: value } : topic
        ),
      };
    }
    return week;
  });
}

// Delete a topic from a week
export function deleteTopicFromWeek(
  weekPlans: WeekPlan[],
  weekId: string,
  topicId: string
): WeekPlan[] {
  return weekPlans.map((week) => {
    if (week.id === weekId && week.topics) {
      return {
        ...week,
        topics: week.topics.filter((topic) => topic.id !== topicId),
      };
    }
    return week;
  });
}

// Update week content
export function updateWeekContent(
  weekPlans: WeekPlan[],
  id: string,
  field: keyof WeekPlan,
  value: any
): WeekPlan[] {
  return weekPlans.map((week) => {
    if (week.id === id) {
      return { ...week, [field]: value };
    }
    return week;
  });
}

// Delete a week
export function deleteWeek(weekPlans: WeekPlan[], id: string): WeekPlan[] {
  const filteredWeeks = weekPlans.filter((week) => week.id !== id);
  // Renumber the weeks
  return filteredWeeks.map((week, idx) => ({
    ...week,
    weekNumber: idx + 1,
  }));
}

// Reorder topics within a week
export function reorderTopicsInWeek(
  weekPlans: WeekPlan[],
  weekId: string,
  reorderedTopics: Topic[]
): WeekPlan[] {
  return weekPlans.map((week) => {
    if (week.id === weekId) {
      return {
        ...week,
        topics: reorderedTopics,
      };
    }
    return week;
  });
}
