import { auth } from "@/lib/auth";
import { checkBarbershopLimit } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NewEstablishmentForm } from "./_components/new-establishment-form";

export default async function NewEstablishmentPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const limitCheck = await checkBarbershopLimit(session.user.id);

  if (!limitCheck.allowed) {
    redirect("/dashboard/owner/establishments");
  }

  const existingProfessional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nova Loja</h1>
        <p className="text-muted-foreground">
          Adicione um novo estabelecimento à sua rede
        </p>
      </div>

      <NewEstablishmentForm showCpfField={!existingProfessional} />
    </div>
  );
}
