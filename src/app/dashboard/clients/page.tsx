import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/clients/ClientForm";

export default async function ClientsPage() {
  const session = await auth();
  const clients = await prisma.client.findMany({
    where: { organizationId: session!.user.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Clients</h1>

      <ClientForm />

      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {clients.length === 0 && (
          <p className="p-4 text-sm text-neutral-500">No clients yet.</p>
        )}
        {clients.map((client) => (
          <div
            key={client.id}
            className="flex items-center justify-between gap-4 p-4"
          >
            <div>
              <p className="text-sm font-medium">{client.name}</p>
              <p className="text-sm text-neutral-500">
                {[client.phone, client.email, client.address]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <form action={deleteClient.bind(null, client.id)}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Remove
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
