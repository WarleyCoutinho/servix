import { notFound } from "next/navigation";
import Image from "next/image";
import { headers } from "next/headers";
import { getBarbershopBySlug, getBarbershopById } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { auth } from "@/lib/auth";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { PageContainer } from "@/components/ui/page";
import { MapPin, Phone, Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ServicesSection } from "@/components/services-section";

interface BarbershopPageProps {
  params: Promise<{ slug: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function BarbershopPage({ params }: BarbershopPageProps) {
  const { slug } = await params;
  const isUUID = UUID_REGEX.test(slug);

  const [barbershop, categories, session] = await Promise.all([
    isUUID ? getBarbershopById(slug) : getBarbershopBySlug(slug),
    getServiceCategories(),
    auth.api.getSession({ headers: await headers() }),
  ]);

  if (!barbershop) notFound();

  const isOwner =
    !!session?.user && !!barbershop.ownerId
      ? session.user.id === barbershop.ownerId
      : false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header categories={categories} />

      {/* ── Hero ── */}
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
          <p className="mt-2 max-w-xl line-clamp-2 text-sm text-white/60">
            {barbershop.description}
          </p>
        </div>
      </div>

      <PageContainer>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* ── Serviços ── */}
          <ServicesSection
            services={barbershop.services}
            barbershop={barbershop}
            isOwner={isOwner}
          />

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card className="border border-border/60 bg-card/60">
              <CardContent className="space-y-5 p-5">
                <div className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Endereço
                    </p>
                    <p className="mt-0.5 text-sm font-medium leading-snug">
                      {barbershop.address}
                    </p>
                    {(barbershop.city || barbershop.state) && (
                      <p className="text-xs text-muted-foreground">
                        {[barbershop.city, barbershop.state]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {barbershop.phones.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Phone className="size-4 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Contato
                        </p>
                        {barbershop.phones.map((phone, i) => (
                          <p key={i} className="text-sm font-medium">
                            {phone}
                          </p>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Scissors className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Serviços
                    </p>
                    <p className="mt-0.5 text-sm font-medium">
                      {barbershop.services.length}{" "}
                      {barbershop.services.length === 1
                        ? "disponível"
                        : "disponíveis"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full gap-2" size="lg">
              <Scissors className="size-4" />
              Agendar horário
            </Button>
          </aside>
        </div>
      </PageContainer>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
