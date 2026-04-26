import Footer from "@/components/footer";
import Header from "@/components/header";
import { PageContainer } from "@/components/ui/page";
import { getBarbershopBySlug } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ServicesSection } from "@/components/services-section";
import { BarbershopCover } from "@/components/barbershop-cover";

interface SlugPageProps {
  params: Promise<{ slug: string }>;
}

const SlugPage = async ({ params }: SlugPageProps) => {
  const { slug } = await params;

  const [barbershop, , session] = await Promise.all([
    getBarbershopBySlug(slug),
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
      <Header />

      <BarbershopCover barbershop={barbershop} isOwner={isOwner} />

      <PageContainer>
        <div className="grid gap-4">
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

export default SlugPage;
