// scripts/seed.ts

import bcrypt from "bcryptjs";
import { db, models } from "../src/lib/db";

const DEMO_USERS = [
  {
    email: "alex@example.com",
    username: "alex_johnson",
    displayName: "Alex Johnson",
    bio: "Software engineer by day, coffee enthusiast always. Building things that matter.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    coverUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
  },
  {
    email: "sarah@example.com",
    username: "sarah_chen",
    displayName: "Sarah Chen",
    bio: "UX designer and illustrator. Making the web clearer one pixel at a time.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    coverUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
  },
  {
    email: "marcus@example.com",
    username: "marcus_dev",
    displayName: "Marcus Williams",
    bio: "Full-stack dev, open source contributor, and guitar player.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    coverUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
  },
];

const POSTS = [
  "Just deployed my first Next.js app with MongoDB. The stack is feeling clean.",
  "Design principle I live by: if it takes more than three seconds to understand, simplify it.",
  "Open sourced a small tool today. Shipping tiny useful things still feels great.",
];

async function main() {
  console.log("Starting MongoDB seed...");

  await Promise.all(Object.values(models).map((model) => model.deleteMany({})));

  const passwordHash = await bcrypt.hash("Password123", 12);
  const users = await Promise.all(
    DEMO_USERS.map((user) =>
      db.user.create({
        data: {
          ...user,
          passwordHash,
          privacySettings: { create: {} },
        },
      })
    )
  );

  await Promise.all(users.map((user) => db.privacySettings.create({ data: { userId: user!.id } })));

  await db.friendship.createMany({
    data: [
      { userAId: users[0]!.id, userBId: users[1]!.id },
      { userAId: users[0]!.id, userBId: users[2]!.id },
    ],
    skipDuplicates: true,
  });

  const posts = await Promise.all(
    POSTS.map((content, index) =>
      db.post.create({
        data: {
          authorId: users[index % users.length]!.id,
          content,
          audience: "PUBLIC",
        },
      })
    )
  );

  await db.comment.create({
    data: {
      postId: posts[0]!.id,
      authorId: users[1]!.id,
      content: "This migration looks much smoother now.",
    },
  });

  await db.like.create({ data: { userId: users[1]!.id, postId: posts[0]!.id } });

  console.log("Seed complete. Demo accounts use password: Password123");
  DEMO_USERS.forEach((user) => console.log(`  ${user.email}`));
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
