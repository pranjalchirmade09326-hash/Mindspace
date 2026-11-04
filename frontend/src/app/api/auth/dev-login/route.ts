import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function persistProfileToPostgres(params: {
  role: string;
  userId: string;
  name: string;
  email: string;
  orgId: string;
}): Promise<void> {
  const dbUrl =
    process.env.FHIR_DATABASE_URL ||
    "postgresql://user:password@localhost:5436/fhir-server";

  try {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString: dbUrl,
      connectionTimeoutMillis: 500,
    });
    await client.connect();

    try {
      if (params.role === "doctor") {
        const checkRes = await client.query(
          "SELECT id FROM practitioner WHERE user_id = $1 LIMIT 1",
          [params.userId]
        );
        let practitionerDbId: number;
        if (checkRes.rows && checkRes.rows.length > 0) {
          practitionerDbId = checkRes.rows[0].id;
          await client.query(
            "UPDATE practitioner SET org_id = $1, active = true, updated_at = NOW() WHERE id = $2",
            [params.orgId, practitionerDbId]
          );
        } else {
          const insertRes = await client.query(
            "INSERT INTO practitioner (user_id, org_id, active, gender, birth_date, created_at, updated_at) VALUES ($1, $2, true, 'male', '1980-08-20', NOW(), NOW()) RETURNING id",
            [params.userId, params.orgId]
          );
          practitionerDbId = insertRes.rows[0].id;
        }

        let cleanName = params.name;
        let prefix = "Dr.";
        if (/^dr\.?\s+/i.test(cleanName)) {
          cleanName = cleanName.replace(/^dr\.?\s+/i, "");
        }
        const nameParts = cleanName.trim().split(/\s+/);
        const given = nameParts[0] || "John";
        const family = nameParts.length > 1 ? nameParts.slice(1).join(" ") : given;

        const nameCheck = await client.query(
          "SELECT id FROM practitioner_name WHERE practitioner_id = $1 LIMIT 1",
          [practitionerDbId]
        );
        if (nameCheck.rows && nameCheck.rows.length > 0) {
          await client.query(
            "UPDATE practitioner_name SET text = $1, family = $2, given = $3, prefix = $4 WHERE id = $5",
            [params.name, family, given, prefix, nameCheck.rows[0].id]
          );
        } else {
          await client.query(
            "INSERT INTO practitioner_name (practitioner_id, org_id, use, text, family, given, prefix) VALUES ($1, $2, 'official', $3, $4, $5, $6)",
            [practitionerDbId, params.orgId, params.name, family, given, prefix]
          );
        }

        const telecomCheck = await client.query(
          "SELECT id FROM practitioner_telecom WHERE practitioner_id = $1 AND system = 'email' LIMIT 1",
          [practitionerDbId]
        );
        if (telecomCheck.rows && telecomCheck.rows.length > 0) {
          await client.query(
            "UPDATE practitioner_telecom SET value = $1 WHERE id = $2",
            [params.email, telecomCheck.rows[0].id]
          );
        } else {
          await client.query(
            "INSERT INTO practitioner_telecom (practitioner_id, org_id, system, value, use) VALUES ($1, $2, 'email', $3, 'work')",
            [practitionerDbId, params.orgId, params.email]
          );
        }
      } else if (params.role === "patient") {
        const checkRes = await client.query(
          "SELECT id FROM patient WHERE user_id = $1 LIMIT 1",
          [params.userId]
        );
        let patientDbId: number;
        if (checkRes.rows && checkRes.rows.length > 0) {
          patientDbId = checkRes.rows[0].id;
          await client.query(
            "UPDATE patient SET org_id = $1, active = true, updated_at = NOW() WHERE id = $2",
            [params.orgId, patientDbId]
          );
        } else {
          const insertRes = await client.query(
            "INSERT INTO patient (user_id, org_id, active, gender, birth_date, created_at, updated_at) VALUES ($1, $2, true, 'female', '1992-04-15', NOW(), NOW()) RETURNING id",
            [params.userId, params.orgId]
          );
          patientDbId = insertRes.rows[0].id;
        }

        const nameParts = params.name.trim().split(/\s+/);
        const given = nameParts[0] || "Sarah";
        const family = nameParts.length > 1 ? nameParts.slice(1).join(" ") : given;

        const nameCheck = await client.query(
          "SELECT id FROM patient_name WHERE patient_id = $1 LIMIT 1",
          [patientDbId]
        );
        if (nameCheck.rows && nameCheck.rows.length > 0) {
          await client.query(
            "UPDATE patient_name SET text = $1, family = $2, given = $3 WHERE id = $4",
            [params.name, family, given, nameCheck.rows[0].id]
          );
        } else {
          await client.query(
            "INSERT INTO patient_name (patient_id, org_id, use, text, family, given) VALUES ($1, $2, 'official', $3, $4, $5)",
            [patientDbId, params.orgId, params.name, family, given]
          );
        }

        const telecomCheck = await client.query(
          "SELECT id FROM patient_telecom WHERE patient_id = $1 AND system = 'email' LIMIT 1",
          [patientDbId]
        );
        if (telecomCheck.rows && telecomCheck.rows.length > 0) {
          await client.query(
            "UPDATE patient_telecom SET value = $1 WHERE id = $2",
            [params.email, telecomCheck.rows[0].id]
          );
        } else {
          await client.query(
            "INSERT INTO patient_telecom (patient_id, org_id, system, value, use) VALUES ($1, $2, 'email', $3, 'home')",
            [patientDbId, params.orgId, params.email]
          );
        }
      }
    } finally {
      await client.end().catch(() => {});
    }
  } catch {
    // Graceful offline fallback when PostgreSQL is unreachable
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawRole = (body.role || "doctor").toString().trim().toLowerCase();
    const role: string =
      rawRole === "doctor" || rawRole === "admin" || rawRole === "patient"
        ? rawRole
        : rawRole.includes("doctor")
        ? "doctor"
        : rawRole.includes("admin")
        ? "admin"
        : rawRole.includes("patient")
        ? "patient"
        : "doctor";
    const locale: string = (body.locale || "en").toString().trim().toLowerCase();
    const email: string =
      body.email ||
      (role === "doctor"
        ? "doctor@mindspace.app"
        : role === "admin"
        ? "admin@mindspace.app"
        : "patient@mindspace.app");
    const name: string =
      (body.name && body.name.trim().length > 0)
        ? body.name.trim()
        : (role === "doctor"
        ? "Dr. John Smith"
        : role === "admin"
        ? "System Administrator"
        : "Sarah Jenkins");

    const defaultRedirect =
      role === "doctor"
        ? `/bezs/telemedicine/doctor/dashboard`
        : role === "admin"
        ? `/bezs/telemedicine/admin/organizations`
        : `/bezs/telemedicine/patient`;

    let redirectPath = (body.redirectUrl || defaultRedirect).replace(/^\/(?:en|hi|ta)(?:\/|$)/, "/");
    if (!redirectPath.startsWith("/")) {
      redirectPath = "/" + redirectPath;
    }
    // Collapse consecutive slashes without breaking root slash
    redirectPath = redirectPath.replace(/\/+/g, "/");

    if (
      redirectPath === "/bezs/telemedicine/doctor" ||
      redirectPath === "/bezs/telemedicine/doctor/" ||
      redirectPath.startsWith("/bezs/telemedicine/doctor?") ||
      redirectPath.startsWith("/bezs/telemedicine/doctor/?")
    ) {
      redirectPath = redirectPath.replace(
        /^\/bezs\/telemedicine\/doctor(?:\/)?(?=\?|$)/,
        "/bezs/telemedicine/doctor/dashboard"
      );
    } else if (
      redirectPath === "/bezs/telemedicine/admin" ||
      redirectPath === "/bezs/telemedicine/admin/" ||
      redirectPath.startsWith("/bezs/telemedicine/admin?") ||
      redirectPath.startsWith("/bezs/telemedicine/admin/?")
    ) {
      redirectPath = redirectPath.replace(
        /^\/bezs\/telemedicine\/admin(?:\/)?(?=\?|$)/,
        "/bezs/telemedicine/admin/organizations"
      );
    }
    const fullRedirectUrl = `/${locale}${redirectPath}`;

    const activeRole = role === "admin" ? "application-admin" : role;
    const activeRoles = role === "admin" ? ["application-admin", "admin"] : [role];

    const sessionData = {
      user: {
        id: `usr-${role}-01`,
        name,
        email,
        emailVerified: true,
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        username: role,
        displayUsername: name,
        twoFactorEnabled: false,
        role: activeRole,
        banned: false,
        banReason: null,
        banExpires: null,
      },
      session: {
        id: `sess-${role}-01`,
        token: "dev-jwt-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ipAddress: "127.0.0.1",
        userAgent: "Local Dev Browser",
        userId: `usr-${role}-01`,
        activeOrganizationId: "org-default-01",
        activeTeamId: null,
        impersonatedBy: null,
        apps: ["telemedicine", "emr", "ai-hub"],
        permissions: ["*"],
        organizations: [
          {
            id: "org-default-01",
            name: "MindSpace Healthcare",
            slug: "mindspace-health",
            logo: null,
          },
        ],
        activeOrganizationRoles: activeRoles,
        activeRoleId: `role-${role}`,
        activeRole: activeRole,
        activeRoleRedirectUrl: redirectPath,
      },
    };

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    };

    const cookieStore = await cookies();
    cookieStore.set("mindspace_session", JSON.stringify(sessionData), cookieOptions);
    cookieStore.set("dev_token", "dev-jwt-token", cookieOptions);
    cookieStore.set("activeRoleRedirectUrl", fullRedirectUrl, cookieOptions);

    const response = NextResponse.json({ success: true, redirectUrl: fullRedirectUrl });
    response.cookies.set("mindspace_session", JSON.stringify(sessionData), cookieOptions);
    response.cookies.set("dev_token", "dev-jwt-token", cookieOptions);
    // Persist clinical profile record to PostgreSQL if available
    await persistProfileToPostgres({
      role,
      userId: `usr-${role}-01`,
      name,
      email,
      orgId: "org-default-01",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to create session" },
      { status: 500 }
    );
  }
}
