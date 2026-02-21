import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { SupportTeamManager } from "./support-team-manager";

export default async function AdminSupportTeamPage() {
  const invites = await prisma.supportInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: { name: true },
      },
    },
  });

  const supportUsers = await prisma.user.findMany({
    where: { role: UserRole.support },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <SupportTeamManager
      initialInvites={invites}
      initialUsers={supportUsers}
    />
  );
}
