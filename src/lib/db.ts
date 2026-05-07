// src/lib/db.ts
// Mongoose-backed data layer with the Prisma-shaped API used by the routes.

import mongoose, { Schema, type Model } from "mongoose";

type AnyDoc = Record<string, any>;
type Args = Record<string, any>;

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables");
}

const mongoUri = MONGODB_URI;

const globalForMongoose = globalThis as unknown as {
  mongoose?: Promise<typeof mongoose>;
};

export async function connectDb() {
  if (!globalForMongoose.mongoose) {
    globalForMongoose.mongoose = mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
  }

  return globalForMongoose.mongoose;
}

function model<T = AnyDoc>(name: string, schema: Schema<T>) {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

const privacyFields = {
  profileVisibility: { type: String, enum: ["PUBLIC", "FRIENDS", "PRIVATE"], default: "PUBLIC" },
  postDefaultAudience: { type: String, enum: ["PUBLIC", "FRIENDS", "ONLY_ME"], default: "PUBLIC" },
  whoCanSendFriendRequest: {
    type: String,
    enum: ["EVERYONE", "FRIENDS_OF_FRIENDS", "NOBODY"],
    default: "EVERYONE",
  },
  whoCanSeeEmail: { type: String, enum: ["PUBLIC", "FRIENDS", "ONLY_ME"], default: "FRIENDS" },
  showOnlineStatus: { type: Boolean, default: true },
};

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true },
    bio: String,
    avatarUrl: String,
    coverUrl: String,
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "users" }
);

const privacySettingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    ...privacyFields,
  },
  { timestamps: true, collection: "privacy_settings" }
);

const postSchema = new Schema(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: String,
    audience: { type: String, enum: ["PUBLIC", "FRIENDS", "ONLY_ME"], default: "PUBLIC" },
    isEdited: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "posts" }
);

const mediaSchema = new Schema(
  {
    uploaderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    mediaType: { type: String, enum: ["IMAGE", "VIDEO", "GIF"], required: true },
    width: Number,
    height: Number,
    duration: Number,
    sizeBytes: Number,
    altText: String,
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "media" }
);

const postMediaSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    mediaId: { type: Schema.Types.ObjectId, ref: "Media", required: true },
    order: { type: Number, default: 0 },
  },
  { collection: "post_media" }
);
postMediaSchema.index({ postId: 1, mediaId: 1 }, { unique: true });

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isEdited: { type: Boolean, default: false },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: true, collection: "comments" }
);

const likeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "likes" }
);
likeSchema.index({ userId: 1, postId: 1 }, { unique: true, partialFilterExpression: { postId: { $type: "objectId" } } });
likeSchema.index({ userId: 1, commentId: 1 }, { unique: true, partialFilterExpression: { commentId: { $type: "objectId" } } });

const reactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    reactionType: { type: String, enum: ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "reactions" }
);
reactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

const friendRequestSchema = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true, collection: "friend_requests" }
);
friendRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

const friendshipSchema = new Schema(
  {
    userAId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userBId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "friendships" }
);
friendshipSchema.index({ userAId: 1, userBId: 1 }, { unique: true });

const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    triggerId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: ["LIKE", "COMMENT", "COMMENT_LIKE", "FRIEND_REQUEST", "FRIEND_ACCEPT", "REACTION", "MENTION", "SYSTEM"],
      required: true,
    },
    entityId: String,
    entityType: String,
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "notifications" }
);

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "refresh_tokens" }
);

const blockSchema = new Schema(
  {
    blockingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    blockedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "blocks" }
);
blockSchema.index({ blockingId: 1, blockedId: 1 }, { unique: true });

const User = model("User", userSchema);
const PrivacySettings = model("PrivacySettings", privacySettingsSchema);
const Post = model("Post", postSchema);
const Media = model("Media", mediaSchema);
const PostMedia = model("PostMedia", postMediaSchema);
const Comment = model("Comment", commentSchema);
const Like = model("Like", likeSchema);
const Reaction = model("Reaction", reactionSchema);
const FriendRequest = model("FriendRequest", friendRequestSchema);
const Friendship = model("Friendship", friendshipSchema);
const Notification = model("Notification", notificationSchema);
const RefreshToken = model("RefreshToken", refreshTokenSchema);
const Block = model("Block", blockSchema);

const objectIdFields = new Set([
  "id",
  "_id",
  "userId",
  "authorId",
  "uploaderId",
  "postId",
  "mediaId",
  "commentId",
  "parentId",
  "senderId",
  "receiverId",
  "userAId",
  "userBId",
  "recipientId",
  "triggerId",
  "blockingId",
  "blockedId",
]);

function oid(value: any) {
  if (value === null || value === undefined || value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : value;
}

function normalizeData(data: AnyDoc = {}) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (value && typeof value === "object" && "create" in value) return [key, value];
      return [key, objectIdFields.has(key) ? oid(value) : value];
    })
  );
}

function normalizeWhere(where: AnyDoc = {}): AnyDoc {
  const out: AnyDoc = {};

  for (const [key, value] of Object.entries(where)) {
    if (key === "id") {
      out._id = oid(value);
    } else if (key === "_id") {
      out._id = oid(value);
    } else if (key === "OR" && Array.isArray(value)) {
      out.$or = value.map(normalizeWhere);
    } else if (key === "NOT") {
      out.$nor = [normalizeWhere(value)];
    } else if (key.includes("_")) {
      Object.assign(out, normalizeUnique(key, value));
    } else if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      if ("contains" in value) {
        out[key] = { $regex: escapeRegex(value.contains), $options: value.mode === "insensitive" ? "i" : "" };
      } else if ("in" in value) {
        out[key] = { $in: value.in.map((v: any) => (objectIdFields.has(key) ? oid(v) : v)) };
      } else if ("lt" in value) {
        out[key] = { $lt: value.lt };
      } else if ("some" in value || "none" in value) {
        // Relation filters are handled by route-level enrichment where needed.
      } else {
        out[key] = objectIdFields.has(key) ? oid(value) : value;
      }
    } else {
      out[key] = objectIdFields.has(key) ? oid(value) : value;
    }
  }

  return out;
}

function normalizeUnique(key: string, value: any) {
  if (key === "userId_postId") return { userId: oid(value.userId), postId: oid(value.postId) };
  if (key === "userId_commentId") return { userId: oid(value.userId), commentId: oid(value.commentId) };
  if (key === "senderId_receiverId") return { senderId: oid(value.senderId), receiverId: oid(value.receiverId) };
  return {};
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toPlain(doc: any): AnyDoc | null {
  if (!doc) return null;
  const raw = typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : doc;
  const { _id, __v, ...rest } = raw;
  return { id: String(_id), ...convertIds(rest) };
}

function convertIds(value: any): any {
  if (value instanceof mongoose.Types.ObjectId) return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(convertIds);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "__v").map(([key, item]) => [key, convertIds(item)]));
  }
  return value;
}

function applySelect(obj: AnyDoc | null, select?: AnyDoc): AnyDoc | null {
  if (!obj || !select) return obj;
  const out: AnyDoc = {};
  for (const [key, value] of Object.entries(select)) {
    if (value === true && key in obj) out[key] = obj[key];
    else if (key in obj && value && typeof value === "object" && "select" in value) {
      out[key] = applySelect(obj[key], value.select);
    } else if (key in obj && value && typeof value === "object") {
      out[key] = obj[key];
    }
  }
  return out;
}

function sortQuery(query: any, orderBy?: AnyDoc | AnyDoc[]) {
  if (!orderBy) return query;
  const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
  return query.sort(Object.fromEntries(Object.entries(order).map(([key, dir]) => [key, dir === "desc" ? -1 : 1])));
}

async function runQuery(model: Model<any>, args: Args, many: boolean) {
  await connectDb();
  const where = normalizeWhere(args.where);
  let query = many ? model.find(where) : model.findOne(where);
  query = sortQuery(query, args.orderBy);
  if (args.cursor?._id || args.cursor?.id) query = query.where("_id").gt(oid(args.cursor.id ?? args.cursor._id));
  if (args.skip) query = query.skip(args.skip);
  if (args.take) query = query.limit(args.take);
  const docs = many ? await query.lean() : await query.lean();
  return docs;
}

async function count(model: Model<any>, args: Args = {}) {
  await connectDb();
  return model.countDocuments(normalizeWhere(args.where));
}

async function createDoc(model: Model<any>, args: Args) {
  await connectDb();
  const data = normalizeData(args.data);
  const created = await model.create(data);
  return hydrateModel(model, toPlain(created), args);
}

async function updateDoc(model: Model<any>, args: Args) {
  await connectDb();
  const updated = await model.findOneAndUpdate(normalizeWhere(args.where), { $set: normalizeData(args.data) }, { new: true }).lean();
  return hydrateModel(model, toPlain(updated), args);
}

async function deleteMany(model: Model<any>, args: Args) {
  await connectDb();
  const result = await model.deleteMany(normalizeWhere(args.where));
  return { count: result.deletedCount };
}

async function updateMany(model: Model<any>, args: Args) {
  await connectDb();
  const result = await model.updateMany(normalizeWhere(args.where), { $set: normalizeData(args.data) });
  return { count: result.modifiedCount };
}

async function findMany(model: Model<any>, args: Args = {}) {
  const docs = await runQuery(model, args, true);
  return Promise.all(docs.map((doc: any) => hydrateModel(model, toPlain(doc), args)));
}

async function findOne(model: Model<any>, args: Args = {}) {
  const doc = await runQuery(model, args, false);
  return hydrateModel(model, toPlain(doc), args);
}

async function upsert(model: Model<any>, args: Args) {
  await connectDb();
  const existing = await model.findOne(normalizeWhere(args.where)).lean();
  if (existing) {
    return updateDoc(model, { where: args.where, data: args.update, select: args.select, include: args.include });
  }
  return createDoc(model, { data: args.create, select: args.select, include: args.include });
}

async function hydrateModel(model: Model<any>, obj: AnyDoc | null, args: Args = {}): Promise<AnyDoc | null> {
  if (!obj) return null;

  if (model === User) obj = await hydrateUser(obj, args);
  if (model === Post) obj = await hydratePost(obj, args);
  if (model === Comment) obj = await hydrateComment(obj, args);
  if (model === FriendRequest) obj = await hydrateFriendRequest(obj, args);
  if (model === Friendship) obj = await hydrateFriendship(obj, args);
  if (model === Notification) obj = await hydrateNotification(obj, args);
  if (model === RefreshToken) obj = await hydrateRefreshToken(obj, args);

  return applySelect(obj, args.select);
}

async function hydrateUser(user: AnyDoc, args: Args) {
  if (args.select?.privacySettings || args.include?.privacySettings) {
    user.privacySettings = await findOne(PrivacySettings, { where: { userId: user.id } });
  }
  if (args.select?._count) {
    user._count = {
      posts: await Post.countDocuments({ authorId: oid(user.id) }),
      friendshipsA: await Friendship.countDocuments({ userAId: oid(user.id) }),
      friendshipsB: await Friendship.countDocuments({ userBId: oid(user.id) }),
    };
  }
  return user;
}

async function hydratePost(post: AnyDoc, args: Args) {
  if (args.select?.author || args.include?.author) {
    post.author = await findOne(User, { where: { id: post.authorId }, select: args.select?.author?.select ?? args.include?.author?.select });
  }
  if (args.select?.media || args.include?.media) {
    post.media = await findMany(PostMedia, { where: { postId: post.id }, orderBy: { order: "asc" }, take: args.select?.media?.take ?? args.include?.media?.take });
    post.media = await Promise.all(post.media.map(async (item: AnyDoc) => ({ ...item, media: await findOne(Media, { where: { id: item.mediaId } }) })));
  }
  if (args.select?._count) {
    post._count = {
      comments: await Comment.countDocuments({ postId: oid(post.id) }),
      likes: await Like.countDocuments({ postId: oid(post.id) }),
      reactions: await Reaction.countDocuments({ postId: oid(post.id) }),
    };
  }
  return post;
}

async function hydrateComment(comment: AnyDoc, args: Args) {
  if (args.select?.author || args.include?.author) {
    comment.author = await findOne(User, { where: { id: comment.authorId }, select: args.select?.author?.select ?? args.include?.author?.select });
  }
  if (args.select?._count) {
    comment._count = {
      likes: await Like.countDocuments({ commentId: oid(comment.id) }),
      replies: await Comment.countDocuments({ parentId: oid(comment.id) }),
    };
  }
  return comment;
}

async function hydrateFriendRequest(request: AnyDoc, args: Args) {
  if (args.include?.sender || args.select?.sender) {
    request.sender = await findOne(User, { where: { id: request.senderId }, select: args.include?.sender?.select ?? args.select?.sender?.select });
  }
  if (args.include?.receiver || args.select?.receiver) {
    request.receiver = await findOne(User, { where: { id: request.receiverId }, select: args.include?.receiver?.select ?? args.select?.receiver?.select });
  }
  return request;
}

async function hydrateFriendship(friendship: AnyDoc, args: Args) {
  if (args.select?.userA || args.include?.userA) {
    friendship.userA = await findOne(User, { where: { id: friendship.userAId }, select: args.select?.userA?.select ?? args.include?.userA?.select });
  }
  if (args.select?.userB || args.include?.userB) {
    friendship.userB = await findOne(User, { where: { id: friendship.userBId }, select: args.select?.userB?.select ?? args.include?.userB?.select });
  }
  return friendship;
}

async function hydrateNotification(notification: AnyDoc, args: Args) {
  if (args.include?.trigger || args.select?.trigger) {
    notification.trigger = notification.triggerId
      ? await findOne(User, { where: { id: notification.triggerId }, select: args.include?.trigger?.select ?? args.select?.trigger?.select })
      : null;
  }
  return notification;
}

async function hydrateRefreshToken(token: AnyDoc, args: Args) {
  if (args.include?.user || args.select?.user) {
    token.user = await findOne(User, { where: { id: token.userId }, select: args.include?.user?.select ?? args.select?.user?.select });
  }
  return token;
}

function delegate(model: Model<any>) {
  return {
    findMany: (args?: Args) => findMany(model, args),
    findUnique: (args?: Args) => findOne(model, args),
    findFirst: (args?: Args) => findOne(model, args),
    count: (args?: Args) => count(model, args),
    create: (args: Args) => createDoc(model, args),
    update: (args: Args) => updateDoc(model, args),
    updateMany: (args: Args) => updateMany(model, args),
    deleteMany: (args: Args) => deleteMany(model, args),
    delete: async (args: Args) => {
      await connectDb();
      const deleted = await model.findOneAndDelete(normalizeWhere(args.where)).lean();
      return toPlain(deleted);
    },
    createMany: async (args: Args) => {
      await connectDb();
      const docs = args.data.map(normalizeData);
      try {
        const result = await model.insertMany(docs, { ordered: !args.skipDuplicates });
        return { count: result.length };
      } catch (error: any) {
        if (args.skipDuplicates && error.insertedDocs) return { count: error.insertedDocs.length };
        throw error;
      }
    },
    upsert: (args: Args) => upsert(model, args),
  };
}

export const db = {
  user: delegate(User),
  privacySettings: delegate(PrivacySettings),
  post: delegate(Post),
  media: delegate(Media),
  postMedia: delegate(PostMedia),
  comment: delegate(Comment),
  like: delegate(Like),
  reaction: delegate(Reaction),
  friendRequest: delegate(FriendRequest),
  friendship: delegate(Friendship),
  notification: delegate(Notification),
  refreshToken: delegate(RefreshToken),
  block: delegate(Block),
  $transaction: async (actions: any) => {
    if (typeof actions === "function") return actions(db);
    return Promise.all(actions);
  },
  $disconnect: async () => mongoose.disconnect(),
};

export const models = {
  User,
  PrivacySettings,
  Post,
  Media,
  PostMedia,
  Comment,
  Like,
  Reaction,
  FriendRequest,
  Friendship,
  Notification,
  RefreshToken,
  Block,
};

export default db;
