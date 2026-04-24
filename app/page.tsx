import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ServixLanding from "@/components/ServixLanding";

export const metadata: Metadata = {
  title: "Servix — Gestão Profissional para Negócios de Beleza",
  description:
    "Automatize seus agendamentos, receba pelo cartão e envie confirmações pelo WhatsApp. Sua loja no ar em menos de 10 minutos.",
};

export default async function LandingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        ownedBarbershops: { select: { id: true } },
        professional: { select: { id: true } },
      },
    });

    if (user) {
      if (user.role === "admin") redirect("/dashboard/admin");
      if (user.role === "support") redirect("/dashboard/support");
      if (user.role === "owner" && user.ownedBarbershops.length > 0) redirect("/dashboard/owner");
      if (user.role === "owner") redirect("/onboarding/owner");
      if (user.role === "professional" && user.professional) redirect("/dashboard/professional");
      if (user.role === "professional") redirect("/onboarding/professional");
      if (user.role === "client") redirect("/dashboard/client");
    }
  }

  return <ServixLanding />;
}
