import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";
import { getProjectById, updateProject, deleteProject } from "@/db/queries";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify project belongs to user
    const project: any = await getProjectById(id);
    if (!project || project.userId.toString() !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: { name?: string; color?: string } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "Project name cannot be empty" },
          { status: 400 }
        );
      }
      updates.name = body.name.trim();
    }
    if (body.color !== undefined) {
      updates.color = body.color;
    }

    const updated = await updateProject(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Projects] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify project belongs to user
    const project: any = await getProjectById(id);
    if (!project || project.userId.toString() !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Projects] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
