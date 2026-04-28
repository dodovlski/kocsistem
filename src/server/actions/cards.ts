"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBoardAccess } from "@/lib/auth";
import { orderAtEnd, orderBetween } from "@/lib/ordering";
import { logActivity } from "./activity";

async function boardIdForColumn(columnId: string): Promise<string> {
  const col = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  });
  if (!col) throw new Error("Column not found");
  return col.boardId;
}

async function boardIdForCard(cardId: string): Promise<string> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  });
  if (!card) throw new Error("Card not found");
  return card.column.boardId;
}

const createSchema = z.object({
  columnId: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
});

export async function createCard(input: z.infer<typeof createSchema>) {
  const { columnId, title, description } = createSchema.parse(input);
  const boardId = await boardIdForColumn(columnId);
  const { user } = await requireBoardAccess(boardId, "EDITOR");

  const last = await prisma.card.findFirst({
    where: { columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const card = await prisma.card.create({
    data: {
      columnId,
      title,
      description: description ? description : null,
      order: orderAtEnd(last?.order ?? null),
    },
  });

  await logActivity(card.id, user.id, "card_created", { title });

  revalidatePath(`/boards/${boardId}`);
  return card;
}

const updateSchema = z.object({
  cardId: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).nullable().optional(),
  priority: z.enum(["none", "low", "medium", "high"]).optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
});

export async function updateCard(input: z.infer<typeof updateSchema>) {
  const { cardId, title, description, priority, dueDate, assigneeId } =
    updateSchema.parse(input);
  const boardId = await boardIdForCard(cardId);
  const { user } = await requireBoardAccess(boardId, "EDITOR");

  const prev = await prisma.card.findUnique({
    where: { id: cardId },
    select: {
      title: true,
      description: true,
      priority: true,
      dueDate: true,
      assigneeId: true,
      assignee: { select: { name: true, email: true } },
    },
  });

  await prisma.card.update({
    where: { id: cardId },
    data: {
      title,
      description: description ?? null,
      ...(priority !== undefined ? { priority } : {}),
      ...(dueDate !== undefined
        ? { dueDate: dueDate ? new Date(dueDate) : null }
        : {}),
      ...(assigneeId !== undefined ? { assigneeId: assigneeId ?? null } : {}),
    },
  });

  if (prev) {
    if (prev.title !== title) {
      await logActivity(cardId, user.id, "title_changed", {
        from: prev.title,
        to: title,
      });
    }
    if ((prev.description ?? null) !== (description ?? null) && description !== undefined) {
      await logActivity(cardId, user.id, "description_changed");
    }
    if (priority !== undefined && prev.priority !== priority) {
      await logActivity(cardId, user.id, "priority_changed", {
        from: prev.priority,
        to: priority,
      });
    }
    if (dueDate !== undefined) {
      const prevIso = prev.dueDate ? prev.dueDate.toISOString() : null;
      if (prevIso !== (dueDate ?? null)) {
        await logActivity(cardId, user.id, "due_date_changed", {
          from: prevIso ?? undefined,
          to: dueDate ?? undefined,
        });
      }
    }
    if (assigneeId !== undefined && prev.assigneeId !== (assigneeId ?? null)) {
      let newAssigneeName: string | undefined;
      if (assigneeId) {
        const newUser = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { name: true, email: true },
        });
        newAssigneeName = newUser?.name ?? newUser?.email ?? undefined;
      }
      await logActivity(cardId, user.id, "assignee_changed", {
        from: prev.assignee?.name ?? prev.assignee?.email ?? undefined,
        to: newAssigneeName,
      });
    }
  }

  revalidatePath(`/boards/${boardId}`);
}

export async function deleteCard(cardId: string) {
  const boardId = await boardIdForCard(cardId);
  await requireBoardAccess(boardId, "EDITOR");
  await prisma.card.delete({ where: { id: cardId } });
  revalidatePath(`/boards/${boardId}`);
}

const moveSchema = z.object({
  cardId: z.string(),
  targetColumnId: z.string(),
  prevOrder: z.string().nullable(),
  nextOrder: z.string().nullable(),
});

export async function moveCard(input: z.infer<typeof moveSchema>) {
  const { cardId, targetColumnId, prevOrder, nextOrder } =
    moveSchema.parse(input);
  const sourceBoardId = await boardIdForCard(cardId);
  const targetBoardId = await boardIdForColumn(targetColumnId);
  if (sourceBoardId !== targetBoardId) throw new Error("Yetkiniz yok");
  const { user } = await requireBoardAccess(sourceBoardId, "EDITOR");

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { columnId: true, column: { select: { title: true } } },
  });
  const targetColumn = await prisma.column.findUnique({
    where: { id: targetColumnId },
    select: { title: true },
  });

  const order = orderBetween(prevOrder, nextOrder);
  await prisma.card.update({
    where: { id: cardId },
    data: { columnId: targetColumnId, order },
  });

  if (card && targetColumn && card.columnId !== targetColumnId) {
    await logActivity(cardId, user.id, "card_moved", {
      from: card.column.title,
      to: targetColumn.title,
    });
  }

  revalidatePath(`/boards/${sourceBoardId}`);
}
