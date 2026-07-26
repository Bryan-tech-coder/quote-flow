import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logout } from "@/lib/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/quotes" className="text-sm font-semibold">
              QuoteFlow
            </Link>
            <nav className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
              <Link
                href="/dashboard/quotes"
                className="transition hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Quotes
              </Link>
              <Link
                href="/dashboard/clients"
                className="transition hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Clients
              </Link>
              <Link
                href="/dashboard/notifications"
                className="transition hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Notifications
              </Link>
              <Link
                href="/dashboard/settings"
                className="transition hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {session.user.name && (
              <span className="hidden text-sm text-neutral-500 sm:inline">
                {session.user.name}
              </span>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
