import { z } from "zod";

// Schema validation for input data
export const ClassFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  objectives: z.string(),
  duration: z.string().transform((val) => parseInt(val) || 10),
  targetAudience: z.string(),
});

// Topic schema for each content item in a week
export const TopicSchema = z.object({
  id: z.string(),
  type: z.enum(["content", "assignment", "reading", "lecture", "discussion"]),
  title: z.string(),
  description: z.string(),
});

export type Topic = z.infer<typeof TopicSchema>;

// Define WeekPlan schema for generateObject with topics array
export const WeekPlanSchema = z.object({
  id: z.string(),
  weekNumber: z.number(),
  title: z.string(),
  topics: z.array(TopicSchema).optional(),
});

// Create a type from the schema
export type WeekPlan = z.infer<typeof WeekPlanSchema>;
