import { NextResponse } from "next/server";
import { db } from "@/db/queries";
import { class_ } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Class code is required" },
        { status: 400 }
      );
    }

    const classDetails = await db.query.class_.findFirst({
      where: eq(class_.id, code),
    });

    if (!classDetails) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(classDetails);
  } catch (error) {
    console.error("Error fetching class details:", error);
    return NextResponse.json(
      { error: "Failed to fetch class details" },
      { status: 500 }
    );
  }
}
