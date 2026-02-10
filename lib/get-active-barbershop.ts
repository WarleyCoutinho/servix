import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "@/generated/prisma/enums";

const ACTIVE_BARBERSHOP_COOKIE = "active-barbershop-id";

export async function getActiveBarbershop(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedBarbershops: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (
    !user ||
    user.role !== UserRole.owner ||
    user.ownedBarbershops.length === 0
  ) {
    return null;
  }

  const activeBarbershops = user.ownedBarbershops.filter((b) => b.isActive);

  if (activeBarbershops.length === 0) {
    return {
      user,
      activeBarbershop: null,
      ownedBarbershops: activeBarbershops,
      allBarbershops: user.ownedBarbershops,
      hasNoActiveBarbershops: true,
    };
  }

  const cookieStore = await cookies();
  const activeBarbershopId = cookieStore.get(ACTIVE_BARBERSHOP_COOKIE)?.value;

  let activeBarbershop = activeBarbershops.find(
    (b) => b.id === activeBarbershopId,
  );

  if (!activeBarbershop) {
    activeBarbershop = activeBarbershops[0];
  }

  return {
    user,
    activeBarbershop,
    ownedBarbershops: activeBarbershops,
    allBarbershops: user.ownedBarbershops,
    hasNoActiveBarbershops: false,
  };
}
