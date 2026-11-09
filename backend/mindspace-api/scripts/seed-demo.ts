import { prisma } from "../src/db.js";
import { intakeContentCipher } from "../src/security/intake-content-cipher.js";

const memberId = "usr-demo-member-01";
const day = 24 * 60 * 60 * 1000;
const id = (suffix: string) => `6f1c0a2e-6a1c-4a6e-9c1e-${suffix}`;

function encrypt(value: string) {
  return intakeContentCipher.encrypt(value);
}

async function seedGoals() {
  const goals = [
    {
      id: id("000000000d01"),
      text: "Take a ten-minute walk after lunch",
      status: "active",
      targetDays: 14,
      checkins: [
        { id: id("000000000d11"), state: "reported", note: "Walked by the park", daysAgo: 1 },
        { id: id("000000000d12"), state: "skipped", note: "Shorter walk, still went", daysAgo: 4 },
      ],
    },
    {
      id: id("000000000d02"),
      text: "Message one friend this week",
      status: "active",
      targetDays: 7,
      checkins: [
        { id: id("000000000d13"), state: "reported", note: "Caught up with Rohan", daysAgo: 2 },
      ],
    },
  ];

  for (const goal of goals) {
    const encrypted = encrypt(goal.text);
    await prisma.wellbeingGoal.upsert({
      where: { id: goal.id },
      update: {},
      create: {
        id: goal.id,
        memberId,
        goalCiphertext: encrypted.ciphertext,
        keyVersion: encrypted.keyVersion,
        status: goal.status,
        targetDate: new Date(Date.now() + goal.targetDays * day),
      },
    });
    for (const checkin of goal.checkins) {
      const note = checkin.note ? encrypt(checkin.note) : null;
      await prisma.goalCheckin.upsert({
        where: { id: checkin.id },
        update: {},
        create: {
          id: checkin.id,
          goalId: goal.id,
          memberId,
          checkinState: checkin.state,
          noteCiphertext: note?.ciphertext,
          keyVersion: note?.keyVersion,
          reportedAt: new Date(Date.now() - checkin.daysAgo * day),
        },
      });
    }
  }
}

async function seedJournal() {
  const entries = [
    {
      id: id("000000000e01"),
      title: "A calmer morning",
      body: "Woke up before the alarm and took a slow start. Noting what helped: less phone, more water.",
      daysAgo: 1,
    },
    {
      id: id("000000000e02"),
      title: null,
      body: "Hard afternoon, but I still asked for a break instead of pushing through.",
      daysAgo: 3,
    },
  ];

  for (const entry of entries) {
    const body = encrypt(entry.body);
    const title = entry.title ? encrypt(entry.title) : null;
    await prisma.journalEntry.upsert({
      where: { id: entry.id },
      update: {},
      create: {
        id: entry.id,
        memberId,
        titleCiphertext: title?.ciphertext,
        bodyCiphertext: body.ciphertext,
        keyVersion: body.keyVersion,
        visibility: "private",
        createdAt: new Date(Date.now() - entry.daysAgo * day),
        updatedAt: new Date(Date.now() - entry.daysAgo * day),
      },
    });
  }
}

async function seedMoods() {
  const moods = [
    { id: id("000000000f01"), moodCode: "hopeful", scaleValue: 7, note: "Better than yesterday", hoursAgo: 2 },
    { id: id("000000000f02"), moodCode: "tired", scaleValue: 4, note: "Short sleep", hoursAgo: 26 },
    { id: id("000000000f03"), moodCode: "calm", scaleValue: 8, note: null, hoursAgo: 50 },
  ];

  for (const mood of moods) {
    const note = mood.note ? encrypt(mood.note) : null;
    await prisma.moodEntry.upsert({
      where: { id: mood.id },
      update: {},
      create: {
        id: mood.id,
        memberId,
        moodCode: mood.moodCode,
        scaleCode: "mood",
        scaleValue: mood.scaleValue,
        noteCiphertext: note?.ciphertext,
        keyVersion: note?.keyVersion,
        sourceType: "member",
        recordedAt: new Date(Date.now() - mood.hoursAgo * 60 * 60 * 1000),
      },
    });
  }
}

async function seedReflections() {
  const reflections = [
    {
      id: id("000000001001"),
      type: "weekly_reflection",
      status: "completed",
      startedDaysAgo: 2,
      completedDaysAgo: 2,
    },
    {
      id: id("000000001002"),
      type: "evening_checkin",
      status: "in_progress",
      startedDaysAgo: 0,
      completedDaysAgo: null,
    },
  ];

  for (const reflection of reflections) {
    await prisma.wellbeingReflection.upsert({
      where: { id: reflection.id },
      update: {},
      create: {
        id: reflection.id,
        memberId,
        reflectionType: reflection.type,
        promptVersion: "2026.1",
        locale: "en",
        status: reflection.status,
        sourceType: "member",
        startedAt: new Date(Date.now() - reflection.startedDaysAgo * day - 60 * 60 * 1000),
        completedAt:
          reflection.completedDaysAgo == null ? null : new Date(Date.now() - reflection.completedDaysAgo * day),
      },
    });
  }
}

async function seedPrivacyRequests() {
  const requests = [
    {
      id: id("000000001101"),
      type: "export",
      state: "in_progress",
      verification: "verified",
      requestedDaysAgo: 3,
      dueDaysAhead: 27,
      completedDaysAgo: null,
      resolution: null,
    },
    {
      id: id("000000001102"),
      type: "correction",
      state: "completed",
      verification: "verified",
      requestedDaysAgo: 20,
      dueDaysAhead: -6,
      completedDaysAgo: 18,
      resolution: "applied",
    },
  ];

  for (const request of requests) {
    await prisma.privacyRequest.upsert({
      where: { id: request.id },
      update: {},
      create: {
        id: request.id,
        userId: memberId,
        requestType: request.type,
        requestState: request.state,
        verificationState: request.verification,
        requestedAt: new Date(Date.now() - request.requestedDaysAgo * day),
        dueAt: new Date(Date.now() + request.dueDaysAhead * day),
        completedAt:
          request.completedDaysAgo == null ? null : new Date(Date.now() - request.completedDaysAgo * day),
        resolutionCode: request.resolution,
      },
    });
  }
}

async function main() {
  await seedGoals();
  await seedJournal();
  await seedMoods();
  await seedReflections();
  await seedPrivacyRequests();
  console.log("seeded member wellbeing, journal, reflection, and privacy request demo records");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
