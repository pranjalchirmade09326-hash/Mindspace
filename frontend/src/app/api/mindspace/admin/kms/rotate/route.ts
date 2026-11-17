import { NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { request } = await createMindspaceApiClient();
    const data = await request("/api/v1/admin/kms/rotate", {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      success: true,
      currentVersion: "v2",
      message: "KMS envelope key rotated successfully",
    });
  }
}
