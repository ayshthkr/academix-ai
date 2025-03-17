import { NextResponse } from "next/server";
import { db } from "@/db/queries";
import { classEnrollment, class_ } from "@/db/schema";
import { auth } from "@/app/(auth)/auth";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to join a class" },
        { status: 401 }
      );
    }

    const { classCode } = await req.json();
    if (!classCode) {
      return NextResponse.json(
        { error: "Class code is required" },
        { status: 400 }
      );
    }

    // Check if class exists
    const classExists = await db.query.class_.findFirst({
      where: eq(class_.id, classCode),
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Invalid class code" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.query.classEnrollment.findFirst({
      where: and(
        eq(classEnrollment.classId, classCode),
        eq(classEnrollment.userId, session.user.id!)
      ),
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "You are already enrolled in this class" },
        { status: 409 }
      );
    }

    // Create enrollment
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User ID is missing" },
        { status: 400 }
      );
    }

    await db.insert(classEnrollment).values({
      classId: classCode,
      userId: session.user.id as string,
      role: "student",
    });

    return NextResponse.json(
      { success: true, message: "Successfully joined class" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining class:", error);
    return NextResponse.json(
      { error: "Failed to join class" },
      { status: 500 }
    );
  }
}
