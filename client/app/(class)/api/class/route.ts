import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { generateMemorableId } from "@/lib/id-generator";
import {
  getClassesByUserId,
  createClassWithWeekPlans,
  updateClassWithWeekPlans,
  db
} from "@/db/queries";
import { class_, weekPlan, classEnrollment } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID not found" },
        { status: 401 }
      );
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
        ...classData,
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to create/update class",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID not found" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const classId = url.searchParams.get("id");

    if (!classId) {
      // Get all classes for the user
      const classes = await getClassesByUserId(userId);
      return NextResponse.json({ success: true, classes });
    }

    // Get a specific class
    try {
      // Fetch the class data
      const classData = await db.query.class_.findFirst({
        where: eq(class_.id, classId),
      });

      if (!classData) {
        return NextResponse.json(
          { success: false, error: "Class not found" },
          { status: 404 }
        );
      }

      // Check if user is the creator of the class
      const isCreator = classData.userId === userId;

      // Check if user is enrolled in the class
      const enrollment = await db.query.classEnrollment.findFirst({
        where: and(
          eq(classEnrollment.classId, classId),
          eq(classEnrollment.userId, userId)
        ),
      });

      // If user is neither the creator nor enrolled, deny access
      if (!isCreator && !enrollment) {
        return NextResponse.json(
          { success: false, error: "You don't have access to this class" },
          { status: 403 }
        );
      }

      // Fetch week plans for the class
      const classWeekPlans = await db.query.weekPlan.findMany({
        where: eq(weekPlan.classId, classId),
        orderBy: (weekPlan, { asc }) => [asc(weekPlan.weekNumber)],
      });

      return NextResponse.json({
        success: true,
        class: classData,
        weekPlans: classWeekPlans,
        userRole: isCreator ? "creator" : enrollment?.role,
      });
    } catch (error) {
      console.error("Error fetching specific class:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch class data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to process request",
      },
      { status: 500 }
    );
  }
}
