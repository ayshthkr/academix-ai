import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getUserClasses } from "@/db/queries";

export async function GET() {
  try {
    // Get the current authenticated user
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        error: "Authentication required",
      }, { status: 401 });
    }

    const userId = session.user.id;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: "User ID is required",
      }, { status: 400 });
    }

    // Use the query function to get classes
    const classes = await getUserClasses(userId);

    return NextResponse.json({
      success: true,
      classes,
    });

  } catch (error) {
    console.error("Error fetching user classes:", error);

    return NextResponse.json({
      success: false,
      error: "Failed to fetch classes",
    }, { status: 500 });
  }
}
