"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBoardAccess, requireUser } from "@/lib/auth";
import { logActivity } from "./activity";

async function boardIdForCard(cardId: string): Promise<string> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  });
  if (!card) throw new Error("Card not found");
  return card.column.boardId;
}

async function boardIdForComment(commentId: string): Promise<string> {
  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { card: { select: { column: { select: { boardId: true } } } } },
  });
  if (!c) throw new Error("Comment not found");
  return c.card.column.boardId;
}

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName: string | null;
};

export async function listComments(cardId: string): Promise<CommentDTO[]> {
  const boardId = await boardIdForCard(cardId);
  await requireBoardAccess(boardId, "VIEWER");

  const rows = await prisma.comment.findMany({
    where: { cardId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    userId: r.user.id,
    userEmail: r.user.email,
    userName: r.user.name,
  }));
}

const addSchema = z.object({
  cardId: z.string().min(1),
  body: z.string().trim().min(1).max(5000),
});

export async function addComment(
  input: z.infer<typeof addSchema>,
): Promise<CommentDTO> {
  const { cardId, body } = addSchema.parse(input);
  const boardId = await boardIdForCard(cardId);
  const { user } = await requireBoardAccess(boardId, "EDITOR");

  const c = await prisma.comment.create({
    data: { cardId, userId: user.id, body },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  await logActivity(cardId, user.id, "comment_added");
  revalidatePath(`/boards/${boardId}`);
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    userId: c.user.id,
    userEmail: c.user.email,
    userName: c.user.name,
  };
}

export async function deleteComment(commentId: string) {
  const user = await requireUser();
  const c = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { card: { include: { column: { select: { boardId: true } } } } },
  });
  if (!c) throw new Error("Comment not found");

  const board = await prisma.board.findUnique({
    where: { id: c.card.column.boardId },
    select: { ownerId: true },
  });
  const isOwner = board?.ownerId === user.id;
  if (c.userId !== user.id && !isOwner) {
    throw new Error("Yetkiniz yok");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/boards/${c.card.column.boardId}`);
}
