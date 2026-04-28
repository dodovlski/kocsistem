"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBoardAccess } from "@/lib/auth";
import { logActivity } from "./activity";

const colorEnum = z.enum(["red", "amber", "green", "blue", "violet", "slate"]);

const createSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  color: colorEnum,
});

export async function createLabel(input: z.infer<typeof createSchema>) {
  const { boardId, name, color } = createSchema.parse(input);
  await requireBoardAccess(boardId, "EDITOR");

  const label = await prisma.label.create({
    data: { boardId, name, color },
  });
  revalidatePath(`/boards/${boardId}`);
  return { id: label.id, name: label.name, color: label.color };
}

const updateSchema = z.object({
  labelId: z.string().min(1),
  name: z.string().trim().min(1).max(40),
  color: colorEnum,
});

async function boardIdForLabel(labelId: string): Promise<string> {
  const l = await prisma.label.findUnique({
    where: { id: labelId },
    select: { boardId: true },
  });
  if (!l) throw new Error("Label not found");
  return l.boardId;
}

export async function updateLabel(input: z.infer<typeof updateSchema>) {
  const { labelId, name, color } = updateSchema.parse(input);
  const boardId = await boardIdForLabel(labelId);
  await requireBoardAccess(boardId, "EDITOR");

  await prisma.label.update({
    where: { id: labelId },
    data: { name, color },
  });
  revalidatePath(`/boards/${boardId}`);
}

export async function deleteLabel(labelId: string) {
  const boardId = await boardIdForLabel(labelId);
  await requireBoardAccess(boardId, "EDITOR");
  await prisma.label.delete({ where: { id: labelId } });
  revalidatePath(`/boards/${boardId}`);
}

const toggleSchema = z.object({
  cardId: z.string().min(1),
  labelId: z.string().min(1),
});

async function boardIdForCard(cardId: string): Promise<string> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { column: { select: { boardId: true } } },
  });
  if (!card) throw new Error("Card not found");
  return card.column.boardId;
}

export async function addCardLabel(input: z.infer<typeof toggleSchema>) {
  const { cardId, labelId } = toggleSchema.parse(input);
  const cardBoardId = await boardIdForCard(cardId);
  const labelBoardId = await boardIdForLabel(labelId);
  if (cardBoardId !== labelBoardId) throw new Error("Yetkiniz yok");
  const { user } = await requireBoardAccess(cardBoardId, "EDITOR");

  const label = await prisma.label.findUnique({
    where: { id: labelId },
    select: { name: true },
  });

  await prisma.cardLabel.upsert({
    where: { cardId_labelId: { cardId, labelId } },
    create: { cardId, labelId },
    update: {},
  });
  await logActivity(cardId, user.id, "label_added", { label: label?.name });
  revalidatePath(`/boards/${cardBoardId}`);
}

export async function removeCardLabel(input: z.infer<typeof toggleSchema>) {
  const { cardId, labelId } = toggleSchema.parse(input);
  const cardBoardId = await boardIdForCard(cardId);
  const { user } = await requireBoardAccess(cardBoardId, "EDITOR");

  const label = await prisma.label.findUnique({
    where: { id: labelId },
    select: { name: true },
  });

  await prisma.cardLabel.deleteMany({ where: { cardId, labelId } });
  await logActivity(cardId, user.id, "label_removed", { label: label?.name });
  revalidatePath(`/boards/${cardBoardId}`);
}
