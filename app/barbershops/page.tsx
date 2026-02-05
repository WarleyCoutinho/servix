import Header from "@/components/header";
import Footer from "@/components/footer";
import BarbershopItem from "@/components/barbershop-item";
import { getBarbershopsByServiceName } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";

interface BarbershopsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const { search } = await searchParams;
  const [barbershops, categories] = await Promise.all([
    search ? getBarbershopsByServiceName(search) : Promise.resolve([]),
    getServiceCategories(),
  ]);

  return (
    <div>
      <Header categories={categories} />
      <PageContainer>
        <PageSectionContent>
          <PageSectionTitle>
            Resultados para &quot;{search || ""}&quot;
          </PageSectionTitle>
          {barbershops.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma barbearia encontrada.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {barbershops.map((barbershop) => (
                <BarbershopItem key={barbershop.id} barbershop={barbershop} />
              ))}
            </div>
          )}
        </PageSectionContent>
      </PageContainer>
      <Footer />
    </div>
  );
};

export default BarbershopsPage;
