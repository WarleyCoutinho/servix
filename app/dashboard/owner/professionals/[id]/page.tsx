import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { prisma } from "@/lib/prisma";
import { getUserPlanInfo, getPlanLimits } from "@/lib/plan-limits";
import { ArrowLeft, UserCheck, UserX } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProfessionalForm from "./_components/professional-form";

interface ProfessionalPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfessionalPage({
  params,
}: ProfessionalPageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getActiveBarbershop(session.user.id);

  if (!data || !data.activeBarbershop) {
    redirect("/dashboard/owner/subscription");
  }

  const { activeBarbershop, user } = data;

  const planInfo = await getUserPlanInfo(user.id, activeBarbershop.id);
  const limits = await getPlanLimits(activeBarbershop.id);

  const professional = await prisma.professional.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!professional) {
    notFound();
  }

  if (professional.barbershopId !== activeBarbershop.id) {
    redirect("/dashboard/owner/professionals");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/dashboard/owner/professionals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Avatar className="h-12 w-12 shrink-0 sm:h-16 sm:w-16">
            <AvatarImage
              src={professional.imageUrl ?? professional.user.image ?? ""}
            />
            <AvatarFallback className="text-base sm:text-lg">
              {(professional.displayName ?? professional.user.name)
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">
                {professional.displayName ?? professional.user.name}
              </h1>
              {professional.isActive ? (
                <Badge variant="default" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <UserX className="h-3 w-3" />
                  Bloqueado
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground truncate text-sm sm:text-base">
              {professional.user.email}
            </p>
          </div>
        </div>
      </div>

      <ProfessionalForm
        professional={professional}
        isBasicPlan={planInfo?.isBasicPlan ?? false}
        isOwnerProfessional={professional.userId === user.id}
        canActivateProfessional={limits?.canAddProfessional ?? false}
      />
    </div>
  );
}
