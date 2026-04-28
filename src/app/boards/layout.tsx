import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/server/actions/auth";

export default async function BoardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <header className="bg-brand-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/boards"
            className="flex items-center gap-2 font-bold tracking-tight"
          >
            <span className="inline-block h-5 w-1 bg-brand-red" />
            Koç Sprint
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/about"
              className="rounded-sm border border-white/20 bg-transparent px-3 py-1.5 text-white hover:bg-white/10"
            >
              Proje Hakkında
            </Link>
            <span className="text-white/70 hidden sm:inline">
              {session.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-sm border border-white/20 bg-transparent px-3 py-1.5 text-white hover:bg-white/10"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col">{children}</div>
    </>
  );
}
