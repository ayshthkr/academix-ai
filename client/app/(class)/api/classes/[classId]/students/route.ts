import { NextResponse } from "next/server";
import { db } from "@/db/queries";
import { class_, classEnrollment, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/(auth)/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const classId = (await params).classId;

    // First verify if the user is a teacher of this class
    const isTeacher = await db.query.classEnrollment.findFirst({
      where: and(
        eq(classEnrollment.classId, classId),
        eq(classEnrollment.userId, session.user.id!),
        eq(classEnrollment.role, "teacher")
      ),
    });

    // Allow access if user is the creator of the class
    const isCreator = await db.query.class_.findFirst({
      where: and(
        eq(class_.id, classId),
        eq(class_.userId, session.user.id!)
      ),
    });

    if (!isTeacher && !isCreator) {
      return NextResponse.json(
        { error: "Only teachers can view enrolled students" },
        { status: 403 }
      );
    }

    // Get all enrolled students (exclude teachers)
    const enrolledStudents = await db.select({
      id: user.id,
      email: user.email,
      joinedAt: classEnrollment.joinedAt,
    })
    .from(classEnrollment)
    .innerJoin(user, eq(classEnrollment.userId, user.id))
    .where(
      and(
        eq(classEnrollment.classId, classId),
        eq(classEnrollment.role, "student")
      )
    );

    return NextResponse.json(enrolledStudents);
  } catch (error) {
    console.error("Error fetching enrolled students:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrolled students" },
      { status: 500 }
    );
  }
}
