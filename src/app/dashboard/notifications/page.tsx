import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  SENT: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export default async function NotificationsPage() {
  const session = await auth();
  const notifications = await prisma.notification.findMany({
    where: { organizationId: session!.user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { quote: { select: { title: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
      <p className="text-sm text-neutral-500">
        Delivery log for quote emails. Failed sends retry automatically with
        exponential backoff, up to 5 attempts.
      </p>

      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {notifications.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">No notifications yet.</p>
        )}
        {notifications.map((n) => (
          <div key={n.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium">{n.subject}</p>
              <p className="text-sm text-neutral-500">
                to {n.recipient}
                {n.quote?.title ? ` · ${n.quote.title}` : ""}
                {n.attempts > 0 ? ` · ${n.attempts} attempt(s)` : ""}
              </p>
              {n.lastError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {n.lastError}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[n.status]}`}
            >
              {n.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
