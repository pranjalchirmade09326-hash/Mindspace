/**
 * Demo Users Seed API Route
 * POST /api/seed/demo-users
 *
 * Seeds demo users into the database for quick testing
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// Simple hash function (for demo only - use bcrypt in production)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface DemoMember {
  email: string;
  password: string;
  displayName: string;
  mood: "HAPPY" | "SAD" | "ANXIOUS" | "NEUTRAL" | "STRESSED";
  journalEntries: number;
  supportSessions: number;
  consecutiveDays: number;
}

interface DemoListener {
  email: string;
  password: string;
  displayName: string;
  rating: number;
  totalConversations: number;
  activeNow: boolean;
  specialty: string;
}

const DEMO_MEMBERS: DemoMember[] = [
  {
    email: "member@demo.com",
    password: "demo123456",
    displayName: "Sarah Chen",
    mood: "HAPPY",
    journalEntries: 15,
    supportSessions: 3,
    consecutiveDays: 7,
  },
  {
    email: "member2@demo.com",
    password: "demo123456",
    displayName: "Alex Rivera",
    mood: "ANXIOUS",
    journalEntries: 8,
    supportSessions: 2,
    consecutiveDays: 4,
  },
];

const DEMO_LISTENERS: DemoListener[] = [
  {
    email: "listener@demo.com",
    password: "demo123456",
    displayName: "Marcus Johnson",
    rating: 4.8,
    totalConversations: 42,
    activeNow: true,
    specialty: "anxiety-support",
  },
  {
    email: "listener2@demo.com",
    password: "demo123456",
    displayName: "Emma Williams",
    rating: 4.9,
    totalConversations: 58,
    activeNow: true,
    specialty: "life-transitions",
  },
];

const DEMO_ADMIN = {
  email: "admin@demo.com",
  password: "demo123456",
  displayName: "Admin User",
};

export async function POST(req: NextRequest) {
  try {
    // Simple auth check - in production use proper authentication
    const authHeader = req.headers.get("authorization");
    if (
      !authHeader ||
      authHeader !== `Bearer ${process.env.SEED_SECRET || "demo-seed-secret"}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const results = {
      members: [] as string[],
      listeners: [] as string[],
      admin: null as string | null,
    };

    // Seed Members
    for (const member of DEMO_MEMBERS) {
      const demoUserData = {
        email: member.email,
        password: hashPassword(member.password),
        role: "member",
        profile: JSON.stringify({
          displayName: member.displayName,
          mood: member.mood,
        }),
      };

      const existingDemoUser = await prisma.demoUser.findUnique({
        where: { email: member.email },
      });

      let demoUser;
      if (existingDemoUser) {
        demoUser = await prisma.demoUser.update({
          where: { email: member.email },
          data: demoUserData,
        });
      } else {
        demoUser = await prisma.demoUser.create({
          data: demoUserData,
        });
      }

      const existingMember = await prisma.memberProfile.findUnique({
        where: { userId: demoUser.id },
      });

      if (existingMember) {
        await prisma.memberProfile.update({
          where: { userId: demoUser.id },
          data: {
            displayName: member.displayName,
            moodToday: member.mood,
            journalEntries: member.journalEntries,
            supportSessions: member.supportSessions,
            consecutiveDays: member.consecutiveDays,
            bio: `A passionate member focused on ${member.mood.toLowerCase()} support.`,
            preferredTopics: JSON.stringify([
              "mental-health",
              "self-care",
              "wellness",
            ]),
            lastActive: new Date(),
          },
        });
      } else {
        await prisma.memberProfile.create({
          data: {
            userId: demoUser.id,
            displayName: member.displayName,
            avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${member.displayName}`,
            moodToday: member.mood,
            journalEntries: member.journalEntries,
            supportSessions: member.supportSessions,
            consecutiveDays: member.consecutiveDays,
            bio: `A passionate member focused on ${member.mood.toLowerCase()} support.`,
            preferredTopics: JSON.stringify([
              "mental-health",
              "self-care",
              "wellness",
            ]),
            lastActive: new Date(),
          },
        });
      }

      results.members.push(member.email);
    }

    // Seed Listeners
    for (const listener of DEMO_LISTENERS) {
      const demoUserData = {
        email: listener.email,
        password: hashPassword(listener.password),
        role: "listener",
        profile: JSON.stringify({
          displayName: listener.displayName,
          specialty: listener.specialty,
          rating: listener.rating,
        }),
      };

      const existingDemoUser = await prisma.demoUser.findUnique({
        where: { email: listener.email },
      });

      let demoUser;
      if (existingDemoUser) {
        demoUser = await prisma.demoUser.update({
          where: { email: listener.email },
          data: demoUserData,
        });
      } else {
        demoUser = await prisma.demoUser.create({
          data: demoUserData,
        });
      }

      const existingListener = await prisma.listenerProfile.findUnique({
        where: { userId: demoUser.id },
      });

      if (existingListener) {
        await prisma.listenerProfile.update({
          where: { userId: demoUser.id },
          data: {
            displayName: listener.displayName,
            activeNow: listener.activeNow,
            rating: listener.rating,
            totalConversations: listener.totalConversations,
            responseTime: 5,
            availability: JSON.stringify([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ]),
            specialties: JSON.stringify([listener.specialty]),
            bio: `Experienced listener specializing in ${listener.specialty.replace("-", " ")}.`,
            trainingStatus: "ACTIVE",
          },
        });
      } else {
        await prisma.listenerProfile.create({
          data: {
            userId: demoUser.id,
            displayName: listener.displayName,
            avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${listener.displayName}`,
            activeNow: listener.activeNow,
            rating: listener.rating,
            totalConversations: listener.totalConversations,
            responseTime: 5,
            availability: JSON.stringify([
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ]),
            specialties: JSON.stringify([listener.specialty]),
            bio: `Experienced listener specializing in ${listener.specialty.replace("-", " ")}.`,
            trainingStatus: "ACTIVE",
          },
        });
      }

      results.listeners.push(listener.email);
    }

    // Seed Admin
    const adminDemoUserData = {
      email: DEMO_ADMIN.email,
      password: hashPassword(DEMO_ADMIN.password),
      role: "admin",
      profile: JSON.stringify({
        displayName: DEMO_ADMIN.displayName,
      }),
    };

    const existingAdmin = await prisma.demoUser.findUnique({
      where: { email: DEMO_ADMIN.email },
    });

    if (existingAdmin) {
      await prisma.demoUser.update({
        where: { email: DEMO_ADMIN.email },
        data: adminDemoUserData,
      });
    } else {
      await prisma.demoUser.create({
        data: adminDemoUserData,
      });
    }

    results.admin = DEMO_ADMIN.email;

    return NextResponse.json({
      success: true,
      message: "Demo users seeded successfully",
      results,
    });
  } catch (error) {
    console.error("Error seeding demo users:", error);
    return NextResponse.json(
      {
        error: "Failed to seed demo users",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Demo users seed endpoint",
    usage: "POST with Authorization: Bearer {SEED_SECRET}",
  });
}
