import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfessionalSettingsClient from "./_components/professional-settings-client";

export default async function ProfessionalSettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const professional = await prisma.professional.findFirst({
    where: { userId: session.user.id },
  });

  if (!professional) {
    redirect("/onboarding/professional");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas formas de pagamento e conexão WhatsApp.
        </p>
      </div>
      <ProfessionalSettingsClient
        professional={{
          id: professional.id,
          acceptsPix: professional.acceptsPix,
          acceptsCard: professional.acceptsCard,
          acceptsPayAfterService: professional.acceptsPayAfterService,
          whatsappGroupName: professional.whatsappGroupName,
          scheduleViewType: professional.scheduleViewType ?? "DEFAULT",
        }}
      />
    </div>
  );
}
