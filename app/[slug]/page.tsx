import Footer from "@/components/footer";
import Header from "@/components/header";
import ServiceItem from "@/components/service-item";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";
import { getBarbershopBySlug } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { MapPin, Phone } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

const SlugPage = async ({ params }: SlugPageProps) => {
  const { slug } = await params;

  const [barbershop, categories] = await Promise.all([
    getBarbershopBySlug(slug),
    getServiceCategories(),
  ]);

  if (!barbershop) {
    notFound();
  }

  return (
    <div>
      <Header categories={categories} />

      <div className="relative h-[220px] w-full sm:h-[320px]">
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
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
