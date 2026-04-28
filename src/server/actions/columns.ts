"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBoardAccess } from "@/lib/auth";
import { orderAtEnd, orderBetween } from "@/lib/ordering";

async function boardIdForColumn(columnId: string): Promise<string> {
  const col = await prisma.column.findUnique({
    where: { id: columnId },
    select: { boardId: true },
  });
  if (!col) throw new Error("Column not found");
  return col.boardId;
}

const createSchema = z.object({
  boardId: z.string().min(1),
  title: z.string().trim().min(1).max(60),
});

export async function createColumn(input: z.infer<typeof createSchema>) {
  const { boardId, title } = createSchema.parse(input);
  await requireBoardAccess(boardId, "EDITOR");

  const last = await prisma.column.findFirst({
    where: { boardId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const column = await prisma.column.create({
    data: { boardId, title, order: orderAtEnd(last?.order ?? null) },
  });
  revalidatePath(`/boards/${boardId}`);
  return column;
}

const renameSchema = z.object({
  columnId: z.string(),
  title: z.string().trim().min(1).max(60),
});

export async function renameColumn(input: z.infer<typeof renameSchema>) {
  const { columnId, title } = renameSchema.parse(input);
  const boardId = await boardIdForColumn(columnId);
  await requireBoardAccess(boardId, "EDITOR");

  await prisma.column.update({ where: { id: columnId }, data: { title } });
  revalidatePath(`/boards/${boardId}`);
}

const colorSchema = z.object({
  columnId: z.string(),
  color: z.enum(["red", "amber", "green", "blue", "violet", "slate"]),
});

export async function setColumnColor(input: z.infer<typeof colorSchema>) {
  const { columnId, color } = colorSchema.parse(input);
  const boardId = await boardIdForColumn(columnId);
  await requireBoardAccess(boardId, "EDITOR");

  await prisma.column.update({ where: { id: columnId }, data: { color } });
  revalidatePath(`/boards/${boardId}`);
}

export async function deleteColumn(columnId: string) {
  const boardId = await boardIdForColumn(columnId);
  await requireBoardAccess(boardId, "EDITOR");
  await prisma.column.delete({ where: { id: columnId } });
  revalidatePath(`/boards/${boardId}`);
}

const moveSchema = z.object({
  columnId: z.string(),
  prevOrder: z.string().nullable(),
  nextOrder: z.string().nullable(),
});

export async function moveColumn(input: z.infer<typeof moveSchema>) {
  const { columnId, prevOrder, nextOrder } = moveSchema.parse(input);
  const boardId = await boardIdForColumn(columnId);
  await requireBoardAccess(boardId, "EDITOR");

  const order = orderBetween(prevOrder, nextOrder);
  await prisma.column.update({ where: { id: columnId }, data: { order } });
  revalidatePath(`/boards/${boardId}`);
}
