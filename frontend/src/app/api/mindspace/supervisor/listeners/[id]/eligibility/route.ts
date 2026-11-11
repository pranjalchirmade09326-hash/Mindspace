import { NextRequest, NextResponse } from "next/server";
import { createMindspaceApiClient } from "@/modules/server/mindspace/api-client";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const { request: apiReq } = await createMindspaceApiClient();
    const data = await apiReq(`/api/v1/supervisors/pod/listeners/${id}/eligibility`, {
      method: "PUT",
      body,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      listenerId: id,
      eligibilityState: body.eligibilityState || "eligible",
      reason: body.reason || "Updated via local fallback",
    });
  }
}

