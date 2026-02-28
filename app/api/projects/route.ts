import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getProjectsByUserId, createProject } from "@/db/queries";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await getProjectsByUserId(userId);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("[Projects] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await createProject(
      userId,
      name.trim(),
      color
    );
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[Projects] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
