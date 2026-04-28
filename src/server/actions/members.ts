"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireBoardAccess, requireUser } from "@/lib/auth";

const roleSchema = z.enum(["EDITOR", "VIEWER"]);

const inviteSchema = z.object({
  boardId: z.string().min(1),
  email: z.string().email().toLowerCase().trim(),
  role: roleSchema,
});

export async function inviteToBoard(input: z.infer<typeof inviteSchema>) {
  const { boardId, email, role } = inviteSchema.parse(input);
  const { user, board } = await requireBoardAccess(boardId, "OWNER");

  if (email === user.email.toLowerCase()) {
    throw new Error("You cannot invite yourself");
  }

  const target = await prisma.user.findUnique({ where: { email } });

  if (target) {
    if (target.id === board.ownerId) {
      throw new Error("This user is already the board owner");
    }
    const existing = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId: target.id } },
    });
    if (existing) throw new Error("This user is already a member");
    await prisma.boardMember.create({
      data: { boardId, userId: target.id, role },
    });
  } else {
    const existing = await prisma.boardInvite.findUnique({
      where: { boardId_email: { boardId, email } },
    });
    if (existing) throw new Error("This email is already invited");
    await prisma.boardInvite.create({
      data: { boardId, email, role, invitedBy: user.id },
    });
  }

  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/boards");
}

const updateRoleSchema = z.object({
  boardId: z.string().min(1),
  userId: z.string().min(1),
  role: roleSchema,
});

export async function updateMemberRole(
  input: z.infer<typeof updateRoleSchema>,
) {
  const { boardId, userId, role } = updateRoleSchema.parse(input);
  const { board } = await requireBoardAccess(boardId, "OWNER");
  if (userId === board.ownerId) throw new Error("Cannot change owner role");

  await prisma.boardMember.update({
    where: { boardId_userId: { boardId, userId } },
    data: { role },
  });
  revalidatePath(`/boards/${boardId}`);
}

const removeMemberSchema = z.object({
  boardId: z.string().min(1),
  userId: z.string().min(1),
});

export async function removeMember(input: z.infer<typeof removeMemberSchema>) {
  const { boardId, userId } = removeMemberSchema.parse(input);
  const { board } = await requireBoardAccess(boardId, "OWNER");
  if (userId === board.ownerId) throw new Error("Cannot remove owner");

  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId, userId } },
  });
  revalidatePath(`/boards/${boardId}`);
  revalidatePath("/boards");
}

const revokeInviteSchema = z.object({
  boardId: z.string().min(1),
  email: z.string().email().toLowerCase().trim(),
});

export async function revokeInvite(input: z.infer<typeof revokeInviteSchema>) {
  const { boardId, email } = revokeInviteSchema.parse(input);
  await requireBoardAccess(boardId, "OWNER");

  await prisma.boardInvite.delete({
    where: { boardId_email: { boardId, email } },
  });
  revalidatePath(`/boards/${boardId}`);
}

const leaveSchema = z.object({ boardId: z.string().min(1) });

export async function leaveBoard(input: z.infer<typeof leaveSchema>) {
  const { boardId } = leaveSchema.parse(input);
  const user = await requireUser();
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) throw new Error("Board not found");
  if (board.ownerId === user.id) {
    throw new Error("Cannot leave a board you own");
  }
  await prisma.boardMember.delete({
    where: { boardId_userId: { boardId, userId: user.id } },
  });
  revalidatePath("/boards");
}
