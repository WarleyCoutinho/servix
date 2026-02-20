import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ServixManual from "@/components/ServixManual";

export const metadata: Metadata = {
  title: "Manual do Proprietário — Servix",
  description:
    "Guia completo para configurar sua loja no Servix. Do primeiro acesso ao Stripe, passo a passo.",
};

export default async function ManualPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (
    user?.role !== UserRole.owner &&
    user?.role !== UserRole.professional &&
    user?.role !== UserRole.admin
  ) {
    redirect("/");
  }

  return <ServixManual />;
}
