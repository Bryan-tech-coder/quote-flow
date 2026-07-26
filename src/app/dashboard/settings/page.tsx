import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateEmailNotifications } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      <form
        action={updateEmailNotifications}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <h2 className="text-sm font-semibold">Notifications</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="emailNotifications"
            defaultChecked={user?.emailNotifications}
            className="h-4 w-4"
          />
          Email me when a client approves or rejects a quote
        </label>
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Save
        </button>
      </form>
    </div>
  );
}
