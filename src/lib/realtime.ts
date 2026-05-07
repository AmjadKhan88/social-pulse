export async function emitRealtimeNotification(
  recipientId: string,
  notification: unknown
) {
  const socketUrl =
    process.env.SOCKET_SERVER_URL ??
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    "http://localhost:3001";

  try {
    await fetch(`${socketUrl}/emit-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.SOCKET_INTERNAL_SECRET
          ? { "x-socket-secret": process.env.SOCKET_INTERNAL_SECRET }
          : {}),
      },
      body: JSON.stringify({ recipientId, notification }),
    });
  } catch (error) {
    console.error("[REALTIME_NOTIFICATION_ERROR]", error);
  }
}
