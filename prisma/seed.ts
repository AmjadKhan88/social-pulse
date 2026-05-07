// prisma/seed.ts
// Demo seed: 10 users, friendships, posts, comments, likes, notifications

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_USERS = [
  {
    email: "alex@example.com",
    username: "alex_johnson",
    displayName: "Alex Johnson",
    bio: "Software engineer by day, coffee enthusiast always. Building things that matter. 💻☕",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
  },
  {
    email: "sarah@example.com",
    username: "sarah_chen",
    displayName: "Sarah Chen",
    bio: "UX designer & illustrator. Making the web more beautiful one pixel at a time ✨",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
  },
  {
    email: "marcus@example.com",
    username: "marcus_dev",
    displayName: "Marcus Williams",
    bio: "Full-stack dev | Open source contributor | Guitar player 🎸",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
  },
  {
    email: "priya@example.com",
    username: "priya_k",
    displayName: "Priya Kumar",
    bio: "Data scientist & ML engineer. Turning data into insights. 📊🤖",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  },
  {
    email: "james@example.com",
    username: "james_photo",
    displayName: "James Rivera",
    bio: "Travel photographer. 43 countries and counting 🌍📸",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  },
  {
    email: "emma@example.com",
    username: "emma_writes",
    displayName: "Emma Thompson",
    bio: "Writer, storyteller, book lover 📚 Working on my first novel.",
    avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1200&q=80",
  },
  {
    email: "david@example.com",
    username: "david_startup",
    displayName: "David Park",
    bio: "Founder @TechLaunch | Ex-Google | Building the future 🚀",
    avatarUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    isVerified: true,
  },
  {
    email: "nina@example.com",
    username: "nina_fitness",
    displayName: "Nina Patel",
    bio: "Personal trainer & nutritionist. Helping you become the best version of yourself 💪",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
  },
  {
    email: "oliver@example.com",
    username: "oliver_music",
    displayName: "Oliver Bennett",
    bio: "Indie musician. New album dropping next month 🎵 LA → NYC",
    avatarUrl: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80",
  },
  {
    email: "luna@example.com",
    username: "luna_art",
    displayName: "Luna García",
    bio: "Digital artist & animator. Bringing imaginations to life 🎨✨",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    coverUrl:  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80",
  },
];

const POSTS = [
  {
    userIdx: 0,
    content: "Just deployed my first Next.js 15 app to production. The new server components are absolutely game-changing. Performance is insane 🚀 Anyone else making the migration?",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 1,
    content: "Design principle I live by: if it takes more than 3 seconds to understand, it needs to be simplified. Complexity is the enemy of great UX. What are your go-to design principles? 💭",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 2,
    content: "Open sourced my CLI tool for managing env variables across multiple projects. 1k stars in 48 hours! The dev community is incredible 💙 Link in bio.",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 3,
    content: "Trained a model to predict traffic patterns with 94% accuracy using only 2 weeks of data. The key insight? Treating time-series as images and using CNNs instead of LSTMs. Thread coming soon 🧵",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 4,
    content: "Sunrise over the Dolomites. Sometimes you have to wake up at 4am, hike 3 hours in the dark, and freeze to get the shot. Worth every second. 📸",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 5,
    content: "3 years ago I was afraid to call myself a writer. Today I finished the first draft of my novel — 87,000 words. If you're waiting to feel 'ready' before starting: start anyway. The readiness comes after.",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 6,
    content: "We just closed our Series A! $8M to continue building the platform. This wouldn't have been possible without the most incredible team I've ever worked with. Here's to the next chapter 🥂",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 7,
    content: "Myth: You need to work out 2 hours a day to see results.\n\nReality: 30 minutes of consistent, intentional training beats 2 hours of aimless gym time every single time.\n\nConsistency > Intensity, always.",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 8,
    content: "New single drops Friday. Been working on this one for 8 months and I'm genuinely proud of every layer. It's different from anything I've released. Pre-save link in bio 🎵",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 9,
    content: "Spent the last week animating a 60-second short. Hand-crafted every frame. This is why I fell in love with art — the ability to build entire worlds from nothing but imagination and persistence ✨",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 0,
    content: "Hot take: TypeScript strict mode should be the default for all new projects, not an opt-in. The initial friction saves so much debugging time later. Change my mind 👇",
    audience: "PUBLIC" as const,
  },
  {
    userIdx: 2,
    content: "Code review tip: Review the intent, not just the implementation. Ask yourself 'does this solve the right problem in a maintainable way?' before diving into syntax.",
    audience: "FRIENDS" as const,
  },
];

const COMMENTS = [
  { postIdx: 0, userIdx: 1, content: "Server components are a paradigm shift! RSC + streaming = the future 🙌" },
  { postIdx: 0, userIdx: 2, content: "Migration was smooth for us. The biggest win was cutting client-side JS by 60%." },
  { postIdx: 0, userIdx: 3, content: "Any tips for handling auth with server components? That was my main pain point." },
  { postIdx: 1, userIdx: 0, content: "The 3-second rule is gold. I use a similar one: if your grandma can't use it, simplify." },
  { postIdx: 1, userIdx: 4, content: "Another one: design for the edge cases first, the happy path is easy." },
  { postIdx: 2, userIdx: 0, content: "Congrats! Just starred it. The README is really well written." },
  { postIdx: 3, userIdx: 0, content: "This is fascinating! Would love to read the thread when it drops." },
  { postIdx: 3, userIdx: 2, content: "CNN for time series is underrated. We use similar approach at work." },
  { postIdx: 4, userIdx: 1, content: "This photo is breathtaking. The light quality is unreal 😍" },
  { postIdx: 4, userIdx: 5, content: "This is giving me serious travel goals. The Dolomites are on my bucket list!" },
  { postIdx: 5, userIdx: 1, content: "This made me tear up a little. Huge congratulations, Emma! Can't wait to read it." },
  { postIdx: 5, userIdx: 6, content: "This is exactly what I needed to hear today. Starting something scary tomorrow." },
  { postIdx: 6, userIdx: 0, content: "Congrats David!! Well deserved. The product is genuinely amazing." },
  { postIdx: 7, userIdx: 0, content: "Consistency is everything. This applies to code too — small PRs every day > giant PRs once a month." },
  { postIdx: 9, userIdx: 1, content: "Each frame hand-crafted... that dedication is insane and it shows in the quality 💯" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clean up existing data
  await db.$executeRaw`TRUNCATE TABLE "users" CASCADE`;
  console.log("🗑️  Cleared existing data");

  const password = await bcrypt.hash("Password123", 12);

  // Create users
  const users = await Promise.all(
    DEMO_USERS.map((u) =>
      db.user.create({
        data: {
          email:        u.email,
          username:     u.username,
          displayName:  u.displayName,
          bio:          u.bio,
          avatarUrl:    u.avatarUrl,
          coverUrl:     u.coverUrl,
          passwordHash: password,
          isVerified:   u.isVerified ?? false,
          privacySettings: { create: {} },
        },
      })
    )
  );
  console.log(`✅ Created ${users.length} users`);

  // Create friendships (dense social graph)
  const friendPairs: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 6],
    [1, 2], [1, 4], [1, 5], [1, 9],
    [2, 3], [2, 6], [2, 7],
    [3, 4], [3, 8],
    [4, 5], [4, 9],
    [5, 6], [5, 8],
    [6, 7], [6, 9],
    [7, 8], [7, 9],
    [8, 9],
  ];

  await db.friendship.createMany({
    data: friendPairs.map(([a, b]) => ({
      userAId: users[a].id,
      userBId: users[b].id,
    })),
  });
  console.log(`✅ Created ${friendPairs.length} friendships`);

  // Create pending friend requests
  const pendingRequests: [number, number][] = [[2, 8], [3, 9], [1, 7]];
  await db.friendRequest.createMany({
    data: pendingRequests.map(([s, r]) => ({
      senderId:   users[s].id,
      receiverId: users[r].id,
      status:     "PENDING",
    })),
  });
  console.log(`✅ Created ${pendingRequests.length} pending friend requests`);

  // Create posts
  const createdPosts = await Promise.all(
    POSTS.map((p) =>
      db.post.create({
        data: {
          authorId: users[p.userIdx].id,
          content:  p.content,
          audience: p.audience,
        },
      })
    )
  );
  console.log(`✅ Created ${createdPosts.length} posts`);

  // Create comments
  const createdComments = await Promise.all(
    COMMENTS.map((c) =>
      db.comment.create({
        data: {
          postId:   createdPosts[c.postIdx].id,
          authorId: users[c.userIdx].id,
          content:  c.content,
        },
      })
    )
  );
  console.log(`✅ Created ${createdComments.length} comments`);

  // Create likes — each post gets several likes from friends
  const likePairs: [number, number][] = [];
  for (let p = 0; p < createdPosts.length; p++) {
    const likerCount = 2 + Math.floor(Math.random() * 6);
    const likers = [...Array(DEMO_USERS.length).keys()]
      .filter((u) => u !== POSTS[p].userIdx)
      .sort(() => Math.random() - 0.5)
      .slice(0, likerCount);
    likers.forEach((u) => likePairs.push([u, p]));
  }

  await db.like.createMany({
    data: likePairs.map(([u, p]) => ({
      userId: users[u].id,
      postId: createdPosts[p].id,
    })),
    skipDuplicates: true,
  });
  console.log(`✅ Created ${likePairs.length} likes`);

  // Create reactions
  const reactionTypes = ["LIKE", "LOVE", "HAHA", "WOW"] as const;
  const reactions = likePairs.slice(0, 20).map(([u, p], i) => ({
    userId:       users[u].id,
    postId:       createdPosts[p].id,
    reactionType: reactionTypes[i % reactionTypes.length],
  }));
  await db.reaction.createMany({ data: reactions, skipDuplicates: true });
  console.log(`✅ Created ${reactions.length} reactions`);

  // Create notifications
  const notifications = [
    {
      recipientId: users[0].id,
      triggerId:   users[1].id,
      type:        "LIKE" as const,
      entityId:    createdPosts[0].id,
      entityType:  "post",
      message:     "liked your post",
    },
    {
      recipientId: users[0].id,
      triggerId:   users[2].id,
      type:        "COMMENT" as const,
      entityId:    createdPosts[0].id,
      entityType:  "post",
      message:     "commented on your post",
    },
    {
      recipientId: users[0].id,
      triggerId:   users[3].id,
      type:        "FRIEND_REQUEST" as const,
      entityId:    users[3].id,
      entityType:  "user",
      message:     "sent you a friend request",
    },
    {
      recipientId: users[1].id,
      triggerId:   users[0].id,
      type:        "LIKE" as const,
      entityId:    createdPosts[1].id,
      entityType:  "post",
      message:     "liked your post",
    },
    {
      recipientId: users[6].id,
      triggerId:   users[0].id,
      type:        "COMMENT" as const,
      entityId:    createdPosts[6].id,
      entityType:  "post",
      message:     "commented on your post",
    },
  ];

  await db.notification.createMany({ data: notifications });
  console.log(`✅ Created ${notifications.length} notifications`);

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Demo accounts (all use password: Password123):");
  DEMO_USERS.forEach((u) => {
    console.log(`  ${u.email.padEnd(30)} → @${u.username}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
