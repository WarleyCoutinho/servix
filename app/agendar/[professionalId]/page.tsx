import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

interface AgendarPageProps {
  params: Promise<{ professionalId: string }>;
}

const AgendarPage = async ({ params }: AgendarPageProps) => {
  const { professionalId } = await params;

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { barbershopId: true },
  });

  if (!professional) {
    notFound();
  }

  redirect(`/barbershops/${professional.barbershopId}`);
};

export default AgendarPage;
