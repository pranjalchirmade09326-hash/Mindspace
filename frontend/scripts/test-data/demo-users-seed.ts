/**
 * Seed demo users into the database for quick testing and sign-in.
 *
 * Demo users create memberProfiles, listenerProfiles, and demoUser entries
 * with pre-populated test data for each role.
 *
 * Usage:
 *   pnpm tsx scripts/test-data/demo-users-seed.ts
 *
 * After seeding, sign in with any demo account:
 *   Member: member@demo.com / demo123456
 *   Listener: listener@demo.com / demo123456
 *   Admin: admin@demo.com / demo123456
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "node:crypto";

const prisma = new PrismaClient();

// bcrypt-like hash function (simplified for demo)
// In production, use proper bcrypt: `bcrypt.hash(password, 10)`
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface MemberData {
  email: string;
  password: string;
  displayName: string;
  mood: "HAPPY" | "SAD" | "ANXIOUS" | "NEUTRAL" | "STRESSED";
  journalEntries: number;
  supportSessions: number;
  consecutiveDays: number;
}

interface ListenerData {
  email: string;
  password: string;
  displayName: string;
  rating: number;
  totalConversations: number;
  activeNow: boolean;
  specialty: string;
}

interface AdminData {
  email: string;
  password: string;
  displayName: string;
}

const demoMembers: MemberData[] = [
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

const demoListeners: ListenerData[] = [
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

const demoAdmin: AdminData = {
  email: "admin@demo.com",
  password: "demo123456",
  displayName: "Admin User",
};

async function seedDemoUsers() {
  try {
    console.log("🌱 Seeding demo users...\n");

    // Seed Members
    console.log("👤 Creating member profiles...");
    for (const member of demoMembers) {
      // Demo user entry (for quick sign-in)
      const demoUserData = {
        email: member.email,
        password: hashPassword(member.password),
        role: "member",
        profile: {
          displayName: member.displayName,
          mood: member.mood,
        },
      };

      // Create demo user
      const existingDemoUser = await prisma.demoUser.findUnique({
        where: { email: member.email },
      });

      let demoUser;
      if (existingDemoUser) {
        demoUser = await prisma.demoUser.update({
          where: { email: member.email },
          data: demoUserData,
        });
        console.log(`  ✓ Updated demo user: ${member.email}`);
      } else {
        demoUser = await prisma.demoUser.create({
          data: demoUserData,
        });
        console.log(`  ✓ Created demo user: ${member.email}`);
      }

      // Create or update member profile
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
            bio: `A passionate member focused on ${member.mood.toLowerCase()} support and personal growth.`,
            preferredTopics: JSON.stringify([
              "mental-health",
              "self-care",
              "wellness",
            ]),
            lastActive: new Date(),
          },
        });
        console.log(
          `  ✓ Updated member profile: ${member.displayName}`
        );
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
            bio: `A passionate member focused on ${member.mood.toLowerCase()} support and personal growth.`,
            preferredTopics: JSON.stringify([
              "mental-health",
              "self-care",
              "wellness",
            ]),
            lastActive: new Date(),
          },
        });
        console.log(
          `  ✓ Created member profile: ${member.displayName}`
        );
      }
    }

    // Seed Listeners
    console.log("\n🎧 Creating listener profiles...");
    for (const listener of demoListeners) {
      // Demo user entry
      const demoUserData = {
        email: listener.email,
        password: hashPassword(listener.password),
        role: "listener",
        profile: {
          displayName: listener.displayName,
          specialty: listener.specialty,
          rating: listener.rating,
        },
      };

      // Create demo user
      const existingDemoUser = await prisma.demoUser.findUnique({
        where: { email: listener.email },
      });

      let demoUser;
      if (existingDemoUser) {
        demoUser = await prisma.demoUser.update({
          where: { email: listener.email },
          data: demoUserData,
        });
        console.log(`  ✓ Updated demo user: ${listener.email}`);
      } else {
        demoUser = await prisma.demoUser.create({
          data: demoUserData,
        });
        console.log(`  ✓ Created demo user: ${listener.email}`);
      }

      // Create or update listener profile
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
            bio: `Experienced listener specializing in ${listener.specialty.replace("-", " ")}. Here to support your journey with compassion and understanding.`,
            trainingStatus: "ACTIVE",
          },
        });
        console.log(
          `  ✓ Updated listener profile: ${listener.displayName}`
        );
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
            bio: `Experienced listener specializing in ${listener.specialty.replace("-", " ")}. Here to support your journey with compassion and understanding.`,
            trainingStatus: "ACTIVE",
          },
        });
        console.log(
          `  ✓ Created listener profile: ${listener.displayName}`
        );
      }
    }

    // Seed Admin
    console.log("\n👨‍💼 Creating admin profile...");
    const adminDemoUserData = {
      email: demoAdmin.email,
      password: hashPassword(demoAdmin.password),
      role: "admin",
      profile: {
        displayName: demoAdmin.displayName,
      },
    };

    const existingAdmin = await prisma.demoUser.findUnique({
      where: { email: demoAdmin.email },
    });

    if (existingAdmin) {
      await prisma.demoUser.update({
        where: { email: demoAdmin.email },
        data: adminDemoUserData,
      });
      console.log(`  ✓ Updated admin user: ${demoAdmin.email}`);
    } else {
      await prisma.demoUser.create({
        data: adminDemoUserData,
      });
      console.log(`  ✓ Created admin user: ${demoAdmin.email}`);
    }

    console.log("\n✅ Demo users seeded successfully!\n");
    console.log("📝 Demo Credentials:");
    console.log("─────────────────────────────────────────");
    console.log("Members:");
    demoMembers.forEach((m) => {
      console.log(`  📧 ${m.email} / 🔑 ${m.password}`);
    });
    console.log("\nListeners:");
    demoListeners.forEach((l) => {
      console.log(`  📧 ${l.email} / 🔑 ${l.password}`);
    });
    console.log("\nAdmin:");
    console.log(`  📧 ${demoAdmin.email} / 🔑 ${demoAdmin.password}`);
    console.log("─────────────────────────────────────────\n");
  } catch (error) {
    console.error("❌ Error seeding demo users:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoUsers();
