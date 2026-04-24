import Footer from "@/components/footer";
import Header from "@/components/header";

import { PageContainer } from "@/components/ui/page";
import { getBarbershopById } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { auth } from "@/lib/auth";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ServicesSection } from "@/components/services-section";

interface BarbershopDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BarbershopDetailPage = async ({ params }: BarbershopDetailPageProps) => {
  const { id } = await params;
  const [barbershop, categories, session] = await Promise.all([
    getBarbershopById(id),
    getServiceCategories(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!barbershop) {
    notFound();
  }

  const isOwner =
    !!session?.user && !!barbershop.ownerId
      ? session.user.id === barbershop.ownerId
      : false;

  return (
    <div>
      <Header categories={categories} />
      <div className="relative h-85 w-full overflow-hidden sm:h-105 md:h-125">
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/5" />

        {barbershop.isActive && (
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
            <Badge className="gap-1.5 border-0 bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 backdrop-blur-sm">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Aberto
            </Badge>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
            {[barbershop.city, barbershop.state].filter(Boolean).join(", ")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {barbershop.name}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
            <MapPin className="size-4" />
            <p>{barbershop.address}</p>
          </div>
          {barbershop.phones.length > 0 && (
            <div className="mt-1 flex items-center gap-2 text-sm text-white/80">
              <Phone className="size-4" />
              <p>{barbershop.phones.join(" | ")}</p>
            </div>
          )}
        </div>
      </div>

      <PageContainer>
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,1fr_320px]">
          {/* ── Serviços ── */}
          <ServicesSection
            services={barbershop.services}
            barbershop={barbershop}
            isOwner={isOwner}
          />
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
};

export default BarbershopDetailPage;
