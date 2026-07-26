import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-6 py-32 text-center">
        <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
          Professional quotes for your clients, in minutes.
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Build quotes, track their status, and keep every client and project
          organized in one place. Built for contractors and service
          businesses.
        </p>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full bg-black px-8 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:w-auto"
            href="/register"
          >
            Get started
          </Link>
          <Link
            className="flex h-12 w-full items-center justify-center rounded-full border border-black/10 px-8 transition-colors hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10 sm:w-auto"
            href="/login"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
