import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { admin, jwt } from "better-auth/plugins";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { demoUserIds } from "./demo-users.js";
import { roleCodes } from "./roles.js";

const accessControl = createAccessControl(defaultStatements);
const memberRole = accessControl.newRole({ user: [], session: [] });
const adminRole = accessControl.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "set-phone",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});
const applicationRoles = Object.fromEntries(
  roleCodes.map((roleCode) => [roleCode, roleCode === "platform_administrator" ? adminRole : memberRole]),
);

export const auth = betterAuth({
  baseURL: config.baseUrl,
  basePath: "/api/auth",
  secret: config.secret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: config.trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    admin({
      defaultRole: "member",
      adminRoles: ["platform_administrator"],
      roles: applicationRoles,
    }),
    jwt({
      jwks: {
        keyPairConfig: { alg: "EdDSA", crv: "Ed25519" },
      },
      jwt: {
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
        expirationTime: "1h",
        definePayload: ({ user }) => ({
          name: user.name,
          email: user.email,
          role: user.role,
        }),
      },
    }),
  ],
  advanced: {
    database: {
      generateId: () => `usr_${randomUUID().replace(/-/g, "")}`,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.isProduction,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const demoId = demoUserIds[user.email.toLowerCase()];
          return demoId ? { data: { ...user, id: demoId } } : undefined;
        },
      },
    },
  },
});

export type MindspaceAuth = typeof auth;
