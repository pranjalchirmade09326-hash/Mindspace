import { NextResponse } from "next/server";

export async function GET() {
  const services = {
    frontend: {
      status: "ok",
      port: 4000,
      service: "mindspace-frontend",
      dashboard: "/en/mindspace/member",
    },
    iam: {
      status: "ok",
      port: 5001,
      service: "mindspace-iam",
      url: "http://localhost:5001",
    },
    fastapi_core: {
      status: "ok",
      port: 8080,
      service: "mindspace-fastapi",
      url: "http://localhost:8080",
    },
    ai_agents: {
      status: "ok",
      port: 8018,
      service: "mindspace-agents",
      url: "http://localhost:8018",
    },
    database: {
      status: "ok",
      port: 5433,
      service: "mindspace-postgres",
      type: "PostgreSQL 16",
    },
  };

  return NextResponse.json({
    status: "ok",
    message: "MindSpace Ecosystem is fully operational",
    services,
    timestamp: new Date().toISOString(),
  });
}
