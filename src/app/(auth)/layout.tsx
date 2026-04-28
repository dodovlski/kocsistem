import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
