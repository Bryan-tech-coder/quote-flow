import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateEmailNotifications, updateDepositSettings } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
  });
  const organization = await prisma.organization.findUnique({
    where: { id: session!.user.organizationId },
  });
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;

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

      <form
        action={updateDepositSettings}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
      >
        <h2 className="text-sm font-semibold">Deposits</h2>
        <p className="text-sm text-neutral-500">
          Require clients to pay a percentage of the quote upfront via Stripe before
          the job starts. Set to 0 to disable.
        </p>
        <label className="flex items-center gap-2 text-sm">
          Deposit percentage
          <input
            type="number"
            name="depositPercent"
            min={0}
            max={100}
            defaultValue={organization?.depositPercent ?? 0}
            className="w-20 rounded-md border border-neutral-300 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
          />
          %
        </label>
        {!stripeConfigured && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Stripe isn&apos;t configured on this deployment yet — deposits will be
            tracked, but clients won&apos;t be able to pay online until{" "}
            <code>STRIPE_SECRET_KEY</code> is set.
          </p>
        )}
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
