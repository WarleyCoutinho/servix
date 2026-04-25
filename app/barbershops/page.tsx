import BarbershopItem from "@/components/barbershop-item";
import Footer from "@/components/footer";
import Header from "@/components/header";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";
import { getBarbershopsByServiceName } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";

interface BarbershopsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const { search } = await searchParams;
  const [barbershops] = await Promise.all([
    search ? getBarbershopsByServiceName(search) : Promise.resolve([]),
    getServiceCategories(),
  ]);

  return (
    <div>
      <Header />
      <PageContainer>
        <PageSectionContent>
          <PageSectionTitle>
            Resultados para &quot;{search || ""}&quot;
          </PageSectionTitle>
          {barbershops.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma barbearia ou salão de beleza encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {barbershops.map((barbershop) => (
                <BarbershopItem
                  key={barbershop.id}
                  barbershop={barbershop}
                  className="w-full"
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

export default BarbershopsPage;
