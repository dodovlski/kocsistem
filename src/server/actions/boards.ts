"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBoardAccess, requireUser } from "@/lib/auth";
import { orderAtEnd } from "@/lib/ordering";

const createSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80),
});

export async function createBoard(formData: FormData) {
  const user = await requireUser();
  const parsed = createSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid title");
  }

  const board = await prisma.board.create({
    data: {
      title: parsed.data.title,
      ownerId: user.id,
      columns: {
        create: [
          { title: "To Do", order: orderAtEnd(null) },
          { title: "In Progress", order: orderAtEnd("a0") },
          { title: "Done", order: orderAtEnd("a1") },
        ],
      },
    },
  });
  revalidatePath("/boards");
  redirect(`/boards/${board.id}`);
}

export async function deleteBoard(boardId: string) {
  await requireBoardAccess(boardId, "OWNER");
  await prisma.board.delete({ where: { id: boardId } });
  revalidatePath("/boards");
}
