import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { DeleteBoardButton } from "@/components/board/DeleteBoardButton";
import { CreateBoardButton } from "@/components/board/CreateBoardButton";
import { LeaveBoardButton } from "@/components/board/LeaveBoardButton";
import { RoleBadge } from "@/components/board/RoleBadge";

export default async function BoardsPage() {
  const user = await requireUser();
  const [owned, memberships] = await Promise.all([
    prisma.board.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { columns: true } } },
    }),
    prisma.boardMember.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        board: {
          include: {
            owner: { select: { email: true, name: true } },
            _count: { select: { columns: true } },
          },
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 space-y-10">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-1 w-10 bg-brand-red" />
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark">
            Boards
          </h1>
          <p className="text-sm text-brand-muted">
            Create a new board and manage your tasks by dragging them between
            columns.
          </p>
        </div>
        <CreateBoardButton />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Your Boards
        </h2>
        {owned.length === 0 ? (
          <div className="rounded-sm border border-dashed border-brand-border bg-white p-8 text-center text-sm text-brand-muted">
            No boards yet. Create your first board above.
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {owned.map((b) => (
              <li
                key={b.id}
                className="group relative rounded-sm border border-brand-border bg-white hover:shadow-lg hover:border-brand-dark transition-all overflow-hidden"
              >
                <div className="h-1 w-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
                <Link href={`/boards/${b.id}`} className="block p-6">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold tracking-tight text-brand-dark">
                      {b.title}
                    </h2>
                    <RoleBadge role="OWNER" />
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wide text-brand-muted">
                    {b._count.columns} column{b._count.columns !== 1 ? "s" : ""}
                  </p>
                </Link>
                <DeleteBoardButton boardId={b.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {memberships.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Shared with You
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map((m) => {
              const role =
                m.role === "EDITOR" ? ("EDITOR" as const) : ("VIEWER" as const);
              return (
                <li
                  key={m.id}
                  className="group relative rounded-sm border border-brand-border bg-white hover:shadow-lg hover:border-brand-dark transition-all overflow-hidden"
                >
                  <div className="h-1 w-full bg-brand-dark opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Link href={`/boards/${m.board.id}`} className="block p-6">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold tracking-tight text-brand-dark">
                        {m.board.title}
                      </h2>
                      <RoleBadge role={role} />
                    </div>
                    <p className="mt-1 text-xs text-brand-muted">
                      Owner: {m.board.owner.name ?? m.board.owner.email}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-brand-muted">
                      {m.board._count.columns} column{m.board._count.columns !== 1 ? "s" : ""}
                    </p>
                  </Link>
                  <LeaveBoardButton boardId={m.board.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
