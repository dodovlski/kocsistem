import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getBoardAccess, requireUser } from "@/lib/auth";
import { BoardView } from "@/components/board/BoardView";

type BoardPageProps = { params: Promise<{ id: string }> };

export default async function BoardPage(props: BoardPageProps) {
  const { id } = await props.params;
  const user = await requireUser();

  const access = await getBoardAccess(user.id, id);
  if (!access) notFound();

  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      labels: { orderBy: { name: "asc" } },
      columns: {
        orderBy: { order: "asc" },
        include: {
          cards: {
            orderBy: { order: "asc" },
            include: {
              _count: { select: { comments: true } },
              labels: { select: { labelId: true } },
              assignee: { select: { id: true, email: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!board) notFound();

  const isPriority = (v: string): v is "none" | "low" | "medium" | "high" =>
    v === "none" || v === "low" || v === "medium" || v === "high";

  const boardWithCounts = {
    id: board.id,
    title: board.title,
    labels: board.labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
    })),
    columns: board.columns.map((col) => ({
      id: col.id,
      title: col.title,
      color: col.color,
      order: col.order,
      cards: col.cards.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        priority: isPriority(c.priority) ? c.priority : "none",
        dueDate: c.dueDate ? c.dueDate.toISOString() : null,
        columnId: c.columnId,
        order: c.order,
        labelIds: c.labels.map((cl) => cl.labelId),
        commentCount: c._count.comments,
        assigneeId: c.assigneeId,
        assigneeName: c.assignee?.name ?? null,
        assigneeEmail: c.assignee?.email ?? null,
      })),
    })),
  };

  const [members, invites] = access.role === "OWNER"
    ? await Promise.all([
        prisma.boardMember.findMany({
          where: { boardId: id },
          include: { user: { select: { id: true, email: true, name: true } } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.boardInvite.findMany({
          where: { boardId: id },
          orderBy: { createdAt: "asc" },
        }),
      ])
    : [[], []];

  const ownerInfo = await prisma.user.findUnique({
    where: { id: board.ownerId },
    select: { id: true, email: true, name: true },
  });

  // All members who can be assigned to cards (owner + editors/viewers)
  const allMemberRows = await prisma.boardMember.findMany({
    where: { boardId: id },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const boardMembers = [
    { userId: ownerInfo!.id, email: ownerInfo!.email, name: ownerInfo!.name },
    ...allMemberRows.map((m) => ({
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
    })),
  ];

  return (
    <BoardView
      board={boardWithCounts}
      role={access.role}
      currentUser={{ id: user.id, email: user.email }}
      owner={ownerInfo!}
      members={members.map((m) => ({
        userId: m.userId,
        role: m.role === "EDITOR" ? "EDITOR" : "VIEWER",
        email: m.user.email,
        name: m.user.name,
      }))}
      invites={invites.map((i) => ({
        email: i.email,
        role: i.role === "EDITOR" ? "EDITOR" : "VIEWER",
      }))}
      boardMembers={boardMembers}
    />
  );
}
