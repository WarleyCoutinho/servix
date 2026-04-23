import Footer from "@/components/footer";
import Header from "@/components/header";
import ServiceItem from "@/components/service-item";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";
import { getBarbershopById, getBarbershopBySlug } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { MapPin, Phone } from "lucide-react";
import { cookies } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SlugPage = async ({ params }: SlugPageProps) => {
  const { slug } = await params;
  const isUUID = UUID_REGEX.test(slug);

  const [barbershop, categories] = await Promise.all([
    isUUID ? getBarbershopById(slug) : getBarbershopBySlug(slug),
    getServiceCategories(),
  ]);

  if (!barbershop) {
    notFound();
  }

  // Salva o slug da barbearia no cookie para filtrar a home
  const cookieStore = await cookies();
  cookieStore.set("barbershop_slug", barbershop.slug ?? slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    sameSite: "lax",
  });

  return (
    <div>
      <Header categories={categories} />

      <div className="relative h-55 w-full sm:h-80">
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-bold text-white">{barbershop.name}</h1>
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
        {barbershop.description && (
          <PageSectionContent>
            <PageSectionTitle>Sobre nós</PageSectionTitle>
            <p className="text-muted-foreground text-sm">
              {barbershop.description}
            </p>
          </PageSectionContent>
        )}

        <PageSectionContent>
          <PageSectionTitle>Serviços</PageSectionTitle>
          {barbershop.services.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum serviço disponível.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {barbershop.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  barbershop={barbershop}
                />
              ))}
            </div>
          )}
        </PageSectionContent>
      </PageContainer>

      <Footer />
    </div>
  );
};

export default SlugPage;
