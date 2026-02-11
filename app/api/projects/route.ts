import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getUserByEmail, getProjectsByUserId, createProject } from "@/db/queries";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser: any = await getUserByEmail(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const projects = await getProjectsByUserId(dbUser._id.toString());
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
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser: any = await getUserByEmail(session.user.email);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      dbUser._id.toString(),
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
