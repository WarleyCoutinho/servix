import { prisma } from "@/lib/prisma";
import { UsersManager } from "./users-manager";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      ownedBarbershops: {
        select: { id: true, name: true },
        take: 1,
      },
      professional: {
        select: { id: true, barbershopId: true, isActive: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    owners: users.filter((u) => u.role === "owner" || u.role === "owner_professional").length,
    professionals: users.filter((u) => u.role === "professional" || u.role === "owner_professional").length,
    clients: users.filter((u) => u.role === "client").length,
    banned: users.filter((u) => u.banned).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários do sistema
        </p>
      </div>

      <UsersManager initialUsers={users} stats={stats} />
    </div>
  );
}
