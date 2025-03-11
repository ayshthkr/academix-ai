import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, class_, weekPlan } from "./schema";
import { WeekPlan } from "@/app/types";
import { auth } from "@/app/(auth)/auth";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
export let db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function saveClassAndWeeks(
  classData: {
    title: string;
    description: string;
    objectives: string;
    duration: number;
    targetAudience: string;
  },
  weekPlans: WeekPlan[],
  existingClassId?: string // Add parameter for existing class ID
) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    let classId: string;

    if (existingClassId) {
      // Check if the class exists and belongs to the user
      const [existingClass] = await db
        .select()
        .from(class_)
        .where(eq(class_.id, existingClassId));

      if (!existingClass) {
        return { success: false, error: "Class not found" };
      }

      if (existingClass.userId !== session.user.id) {
        return { success: false, error: "Unauthorized" };
      }

      // Update existing class
      await db
        .update(class_)
        .set({
          title: classData.title,
          description: classData.description,
          objectives: classData.objectives,
          duration: classData.duration,
          targetAudience: classData.targetAudience,
          updatedAt: new Date(),
        })
        .where(eq(class_.id, existingClassId));

      classId = existingClassId;

      // Delete existing week plans for this class
      await db.delete(weekPlan).where(eq(weekPlan.classId, classId));
    } else {
      // Create new class
      const [newClass] = await db
        .insert(class_)
        .values({
          id: crypto.randomUUID(),
          title: classData.title,
          description: classData.description,
          objectives: classData.objectives,
          duration: classData.duration,
          targetAudience: classData.targetAudience,
          userId: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newClass?.id) {
        return { success: false, error: "Failed to save class" };
      }

      classId = newClass.id;
    }

    // Save week plans - Update this part to use topics instead of content
    const weekPlanValues = weekPlans.map((week) => ({
      classId: classId,
      weekNumber: week.weekNumber,
      title: week.title,
      topics: JSON.stringify(week.topics || []), // Properly serialize topics as JSON
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(weekPlan).values(weekPlanValues);

    return { success: true, classId: classId };
  } catch (error) {
    console.error("Error saving class and week plans:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save data",
    };
  }
}

export async function getClassWithWeeks({ classId, userId }: { classId: string; userId: string | undefined }) {
  try {
    // First, get the class data and verify ownership
    const [classData] = await db
      .select()
      .from(class_)
      .where(eq(class_.id, classId));

    // If class doesn't exist or user doesn't own it
    if (!classData) {
      return { success: false, error: "Class not found" };
    }

    if (classData.userId !== userId) {
      return { success: false, error: "Unauthorized access to class" };
    }

    // Get all week plans for this class
    const weekPlans = await db
      .select()
      .from(weekPlan)
      .where(eq(weekPlan.classId, classId))
      .orderBy(weekPlan.weekNumber);

    // Parse the topics JSON field for each week plan
    const processedWeekPlans = weekPlans.map(week => ({
      ...week,
      topics: typeof week.topics === 'string' ? JSON.parse(week.topics) : week.topics
    }));

    return {
      success: true,
      classData,
      weekPlans: processedWeekPlans
    };
  } catch (error) {
    console.error("Failed to get class with week plans:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retrieve class data"
    };
  }
}

export async function getClassesByUserId(userId: string) {
  try {
    return await db.select().from(class_).where(eq(class_.userId, userId));
  } catch (error) {
    console.error("Failed to get classes by user ID:", error);
    throw error;
  }
}

export async function createClassWithWeekPlans(
  userId: string,
  classData: {
    id: string;
    title: string;
    description: string;
    objectives: string;
    duration: number;
    targetAudience: string;
  },
  weekPlans: Array<{
    id: string;
    weekNumber: number;
    title: string;
    topics: any;
  }>
) {
  try {
    // Insert the class
    await db.insert(class_).values({
      id: classData.id,
      title: classData.title,
      description: classData.description,
      objectives: classData.objectives,
      duration: classData.duration,
      targetAudience: classData.targetAudience,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert the week plans with always generated UUIDs
    for (const plan of weekPlans) {
      await db.insert(weekPlan).values({
        id: crypto.randomUUID(), // Always generate a new UUID regardless of input
        classId: classData.id,
        weekNumber: plan.weekNumber,
        title: plan.title,
        topics: JSON.stringify(plan.topics), // Ensure topics are stored as JSON
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true, classId: classData.id };
  } catch (error) {
    console.error("Failed to create class with week plans:", error);
    throw error;
  }
}

export async function updateClassWithWeekPlans(
  userId: string,
  classId: string,
  classData: {
    title: string;
    description: string;
    objectives: string;
    duration: number;
    targetAudience: string;
  },
  weekPlans: Array<{
    id: string;
    weekNumber: number;
    title: string;
    topics: any;
  }>
) {
  try {
    // Update the class
    await db
      .update(class_)
      .set({
        title: classData.title,
        description: classData.description,
        objectives: classData.objectives,
        duration: classData.duration,
        targetAudience: classData.targetAudience,
        updatedAt: new Date(),
      })
      .where(and(eq(class_.id, classId), eq(class_.userId, userId)));

    // Delete existing week plans
    await db.delete(weekPlan).where(eq(weekPlan.classId, classId));

    // Insert the new week plans with always generated UUIDs
    for (const plan of weekPlans) {
      await db.insert(weekPlan).values({
        id: crypto.randomUUID(), // Always generate a new UUID regardless of input
        classId: classId,
        weekNumber: plan.weekNumber,
        title: plan.title,
        topics: JSON.stringify(plan.topics), // Ensure topics are stored as JSON
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { success: true, classId };
  } catch (error) {
    console.error("Failed to update class with week plans:", error);
    throw error;
  }
}

export async function getUserClasses(userId: string) {
  try {
    // Fetch classes associated with the user
    const classes = await db.select({
      id: class_.id,
      title: class_.title,
    })
    .from(class_)
    .where(eq(class_.userId, userId))
    .orderBy(desc(class_.createdAt));

    return classes;
  } catch (error) {
    console.error("Failed to get user classes:", error);
    throw error;
  }
}
