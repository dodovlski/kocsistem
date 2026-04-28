import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/boards");

  return (
    <>
      <header className="bg-brand-dark text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link
            href="/"
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
            <Link
              href="/login"
              className="rounded-sm border border-white/20 bg-transparent px-3 py-1.5 text-white hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-sm border border-brand-border bg-white px-3 py-1 text-xs uppercase tracking-wider text-brand-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-red" />
            Kanban · Koç Sprint
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-brand-dark">
            A <span className="text-brand-red">simple and fast</span> task board
            for your team
          </h1>
          <p className="text-lg text-brand-muted">
            Drag and drop cards easily between columns. Order is preserved, and
            flow is never disrupted.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href="/register"
              className="rounded-sm bg-brand-red px-6 py-3 text-sm font-semibold text-white hover:bg-brand-red-hover transition-colors"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="rounded-sm border border-brand-dark bg-white px-6 py-3 text-sm font-semibold text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
