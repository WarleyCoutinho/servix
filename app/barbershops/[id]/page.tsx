import Footer from "@/components/footer";
import Header from "@/components/header";
import { PageContainer } from "@/components/ui/page";
import { getBarbershopById } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ServicesSection } from "@/components/services-section";
import { BarbershopCover } from "@/components/barbershop-cover";

interface BarbershopDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const BarbershopDetailPage = async ({ params }: BarbershopDetailPageProps) => {
  const { id } = await params;
  const [barbershop, , session] = await Promise.all([
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
  const isProfessional =
    !!session?.user &&
    barbershop.professionals?.some((p) => p.userId === session.user.id) ===
      true;
  return (
    <div>
      <Header />

      <BarbershopCover barbershop={barbershop} isOwner={isOwner} />

      <PageContainer>
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,1fr_320px]">
          <ServicesSection
            services={barbershop.services}
            barbershop={barbershop}
            isOwner={isOwner}
            isProfessional={isProfessional}
          />
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
};

export default BarbershopDetailPage;
