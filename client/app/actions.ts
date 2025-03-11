"use server";

import { geminiFlashModel } from "@/ai";
import { generateObject } from "ai";
import { ClassFormSchema, WeekPlan, WeekPlanSchema } from "./types";
import { signOut } from "@/app/(auth)/auth";

export async function generateWeekPlans(formData: unknown) {
  try {
    // Validate input data
    const validatedData = ClassFormSchema.parse(formData);

    // Generate a prompt for the AI
    const prompt = `
      Create a detailed ${validatedData.duration}-week lesson plan for a class titled "${validatedData.title}".

      Class Description: ${validatedData.description}

      Learning Objectives: ${validatedData.objectives}

      Target Audience: ${validatedData.targetAudience}

      For each week, provide:
      1. A title for the week that starts with "Week [number]:"
      2. A structured content plan with different types of activities:
         - Content (lecture material)
         - Assignments
         - Reading materials
         - Discussions

      Please provide these in a structured format where each week has multiple topics.
    `;

    // Use generateObject to directly get structured data from the AI
    const { object } = await generateObject({
      model: geminiFlashModel,
      output: 'array',
      schema: WeekPlanSchema,
      system: "You are an expert educational curriculum designer. Create detailed, practical, and engaging weekly plans for courses with structured topics. Your response should have each week contain multiple topics of different types (content, assignment, reading, lecture, discussion).",
      prompt: prompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // If AI didn't return valid structured data or returned empty array
    if (!Array.isArray(object) || object.length === 0) {
      // Create fallback plan with example topics
      const fallbackPlans: WeekPlan[] = [];
      for (let i = 1; i <= validatedData.duration; i++) {
        fallbackPlans.push({
          id: `week-${i}`,
          weekNumber: i,
          title: `Week ${i}: Introduction and Overview`,
          topics: [
            {
              id: `topic-${i}-1`,
              type: "lecture",
              title: "Introduction to the Topic",
              description: "An overview of this week's material and key concepts."
            },
            {
              id: `topic-${i}-2`,
              type: "reading",
              title: "Essential Readings",
              description: "Chapter 1 of the textbook and supplementary articles."
            },
            {
              id: `topic-${i}-3`,
              type: "assignment",
              title: "Reflection Exercise",
              description: "Write a 500-word reflection on the key concepts from this week."
            }
          ]
        });
      }
      return { success: true, weekPlans: fallbackPlans };
    }

    // Map the returned objects to ensure proper formatting and include topics array
    const weekPlans = object.map((week, index) => {
      // If the AI didn't provide topics, add default ones
      if (!week.topics) {
        week.topics = [
          {
            id: `topic-${index}-1`,
            type: "content",
            title: "Module Content",
            description: "Learning materials for this week."
          },
          {
            id: `topic-${index}-2`,
            type: "assignment",
            title: "Weekly Assignment",
            description: "Complete the exercises related to this week's topic."
          }
        ];
      }

      // Make sure all topics have IDs
      week.topics = week.topics.map((topic, tIdx) => ({
        ...topic,
        id: topic.id || `topic-${index}-${tIdx}`
      }));

      return {
        ...week,
        id: week.id || `week-${index + 1}`,
        weekNumber: week.weekNumber || index + 1,
      };
    });

    return { success: true, weekPlans };
  } catch (error) {
    console.error("Error generating week plans:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate week plans",
    };
  }
}

export async function handleSignOut() {
  await signOut({
    redirectTo: "/",
  });
}
