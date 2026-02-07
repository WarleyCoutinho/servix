import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { ownedBarbershop: true },
  });

  if (!user?.ownedBarbershop) {
    redirect("/");
  }

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

  if (professional.barbershopId !== user.ownedBarbershop.id) {
    redirect("/dashboard/owner/professionals");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/owner/professionals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={professional.imageUrl ?? professional.user.image ?? ""}
            />
            <AvatarFallback className="text-lg">
              {(professional.displayName ?? professional.user.name)
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
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
            <p className="text-muted-foreground">{professional.user.email}</p>
          </div>
        </div>
      </div>

      <ProfessionalForm professional={professional} />
    </div>
  );
}
