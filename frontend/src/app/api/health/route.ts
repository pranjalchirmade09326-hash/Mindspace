import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mindspace-frontend",
    message: "MindSpace Next.js Web Application is running",
    dashboard: "/en/mindspace/member",
    timestamp: new Date().toISOString(),
  });
}
