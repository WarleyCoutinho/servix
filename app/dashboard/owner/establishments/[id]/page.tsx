import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { EstablishmentDetails } from "./_components/establishment-details";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EstablishmentPage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getActiveBarbershop(session.user.id);

  if (!data) {
    redirect("/dashboard/owner/subscription");
  }

  const barbershop = data.allBarbershops?.find((b) => b.id === id);

  if (!barbershop) {
    notFound();
  }

  const barbershopWithDetails = await prisma.barbershop.findUnique({
    where: { id },
    include: {
      subscription: true,
      _count: {
        select: {
          professionals: { where: { isActive: true } },
          services: { where: { deletedAt: null } },
          bookings: true,
        },
      },
    },
  });

  if (!barbershopWithDetails) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <EstablishmentDetails
        barbershop={barbershopWithDetails}
        isActive={data.activeBarbershop?.id === id}
      />
    </div>
  );
}
