"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type ActivityDTO = {
  id: string;
  type: string;
  meta: Record<string, string> | null;
  createdAt: string;
  userName: string | null;
  userEmail: string;
};

export async function listActivity(cardId: string): Promise<ActivityDTO[]> {
  await requireUser();
  const rows = await prisma.activityLog.findMany({
    where: { cardId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { email: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    meta: r.meta ? (JSON.parse(r.meta) as Record<string, string>) : null,
    createdAt: r.createdAt.toISOString(),
    userName: r.user.name,
    userEmail: r.user.email,
  }));
}

export async function logActivity(
  cardId: string,
  userId: string,
  type: string,
  meta?: Record<string, string | null | undefined>,
) {
  const cleanMeta: Record<string, string> = {};
  if (meta) {
    for (const [k, v] of Object.entries(meta)) {
      if (v != null) cleanMeta[k] = String(v);
    }
  }
  await prisma.activityLog.create({
    data: {
      cardId,
      userId,
      type,
      meta: Object.keys(cleanMeta).length > 0 ? JSON.stringify(cleanMeta) : null,
    },
  });
}
