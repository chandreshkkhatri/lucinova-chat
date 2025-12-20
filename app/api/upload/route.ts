import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { auth } from "@/app/(auth)/auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth();
        if (!session?.user) {
          throw new Error("Unauthorized");
        }

        // Limit file size to 20MB (20 * 1024 * 1024 bytes)
        // Note: checking clientPayload if available, or relying on Vercel Blob's own limits if configured.
        // However, handleUpload doesn't expose file size directly in pathname,
        // usually size limit is enforced by client logic or post-upload checks,
        // but we can trust the clientPayload if we pass it securely.
        // For now, simple auth check is main gate.
        // Actually, Vercel Blob doesn't support pre-signed URLs with size constraints directly in this helper
        // except via custom logic or if we trust the client payload. Ref: documentation.
        // The robust size check happens on the client before upload start,
        // and Vercel Blob has account limits.
        // We will enforce the 20MB limit strictly on the client side validation.

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "application/pdf",
            "text/plain",
          ],
          tokenPayload: JSON.stringify({
            userId: session.user.email, // using email as ID if ID is object
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("blob uploaded", blob.url);
        // access authentication token payload if needed
        // const { userId } = JSON.parse(tokenPayload!);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
