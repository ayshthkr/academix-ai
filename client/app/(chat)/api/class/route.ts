import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generateMemorableId } from "@/lib/id-generator";
import {
  getClassesByUserId,
  getClassWithWeeks,
  createClassWithWeekPlans,
  updateClassWithWeekPlans
} from "@/db/queries";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return new Response("User ID not found", { status: 401 });
    }

    const { classData, weekPlans, classId } = await request.json();

    // Validate required fields
    if (!classData || !weekPlans || !Array.isArray(weekPlans)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid data format" },
        { status: 400 }
      );
    }

    if (!classData.title) {
      return NextResponse.json(
        { success: false, error: "Class title is required" },
        { status: 400 }
      );
    }

    // If we're updating an existing class
    if (classId) {
      const result = await updateClassWithWeekPlans(
        userId,
        classId,
        classData,
        weekPlans
      );

      return NextResponse.json({
        success: true,
        classId,
        message: "Class updated successfully",
      });
    }

    // We're creating a new class
    // Generate a memorable ID instead of using UUID
    const newClassId = generateMemorableId();

    const result = await createClassWithWeekPlans(
      userId,
      {
        id: newClassId,
        ...classData
      },
      weekPlans
    );

    return NextResponse.json({
      success: true,
      classId: newClassId,
      message: "Class created successfully",
    });
  } catch (error) {
    console.error("Error creating/updating class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create/update class"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user?.id;
    if (!userId) {
      return new Response("User ID not found", { status: 401 });
    }

    const url = new URL(request.url);
    const classId = url.searchParams.get("id");

    if (!classId) {
      // Get all classes for the user
      const classes = await getClassesByUserId(userId);
      return NextResponse.json({ success: true, classes });
    }

    // Get a specific class and its week plans
    const result = await getClassWithWeeks({ classId, userId });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      class: result.classData,
      weekPlans: result.weekPlans,
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch classes"
      },
      { status: 500 }
    );
  }
}
