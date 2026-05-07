export const postSelect = {
  id: true,
  content: true,
  audience: true,
  isEdited: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      isVerified: true,
      isOnline: true,
      privacySettings: { select: { showOnlineStatus: true } },
    },
  },
  media: {
    include: { media: true },
    orderBy: { order: "asc" as const },
  },
  _count: {
    select: { comments: true, likes: true, reactions: true },
  },
};
