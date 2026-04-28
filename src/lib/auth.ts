import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const COOKIE_NAME = "tf_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = { userId: string; email: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    await destroySession();
    redirect("/login");
  }
  return user;
}

export type BoardRole = "OWNER" | "EDITOR" | "VIEWER";

const ROLE_RANK: Record<BoardRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export function roleAtLeast(role: BoardRole, min: BoardRole) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

export async function getBoardAccess(userId: string, boardId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) return null;
  if (board.ownerId === userId) {
    return { board, role: "OWNER" as BoardRole };
  }
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!member) return null;
  const role = (member.role === "EDITOR" ? "EDITOR" : "VIEWER") as BoardRole;
  return { board, role };
}

export async function requireBoardAccess(boardId: string, min: BoardRole) {
  const user = await requireUser();
  const access = await getBoardAccess(user.id, boardId);
  if (!access || !roleAtLeast(access.role, min)) {
    throw new Error("Yetkiniz yok");
  }
  return { user, board: access.board, role: access.role };
}

export async function acceptPendingInvites(userId: string, email: string) {
  const invites = await prisma.boardInvite.findMany({ where: { email } });
  if (invites.length === 0) return;
  await prisma.$transaction(
    invites.flatMap((inv) => [
      prisma.boardMember.upsert({
        where: { boardId_userId: { boardId: inv.boardId, userId } },
        create: {
          boardId: inv.boardId,
          userId,
          role: inv.role === "EDITOR" ? "EDITOR" : "VIEWER",
        },
        update: {},
      }),
      prisma.boardInvite.delete({ where: { id: inv.id } }),
    ]),
  );
}
