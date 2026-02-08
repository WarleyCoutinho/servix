import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { UserRole } from "@/generated/prisma/enums";

const ACTIVE_BARBERSHOP_COOKIE = "active-barbershop-id";

export async function getActiveBarbershop(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownedBarbershops: true },
  });

  if (
    !user ||
    (user.role !== UserRole.owner && user.role !== UserRole.owner_professional) ||
    user.ownedBarbershops.length === 0
  ) {
    return null;
  }

  const cookieStore = await cookies();
  const activeBarbershopId = cookieStore.get(ACTIVE_BARBERSHOP_COOKIE)?.value;

  let activeBarbershop = user.ownedBarbershops.find(
    (b) => b.id === activeBarbershopId
  );

  if (!activeBarbershop) {
    activeBarbershop = user.ownedBarbershops[0];
  }

  return {
    user,
    activeBarbershop,
    ownedBarbershops: user.ownedBarbershops,
  };
}
