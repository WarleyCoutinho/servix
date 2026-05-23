import Footer from "@/components/footer";
import Header from "@/components/header";
import { PageContainer } from "@/components/ui/page";
import { getBarbershopBySlug } from "@/data/barbershops";
import { getServiceCategories } from "@/data/services";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasGoogleCalendarScope } from "@/lib/google-scopes";
import { GoogleCalendarReconnectAlert } from "@/components/google-calendar-reconnect-alert";
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

  if (!barbershop) notFound();

  const isOwner =
    !!session?.user && !!barbershop.ownerId
      ? session.user.id === barbershop.ownerId
      : false;

  const isProfessional =
    !!session?.user &&
    barbershop.professionals?.some((p) => p.userId === session.user.id) ===
      true;

  let needsCalendarPermission = false;

  if (session?.user) {
    const [user, account] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { googleCalendarNeedsReconnect: true },
      }),
      prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "google" },
        select: { scope: true },
      }),
    ]);

    needsCalendarPermission =
      !!user?.googleCalendarNeedsReconnect ||
      !hasGoogleCalendarScope(account?.scope);
  }

  return (
    <div>
      <Header />

      {needsCalendarPermission && <GoogleCalendarReconnectAlert />}

      <BarbershopCover barbershop={barbershop} isOwner={isOwner} />

      <PageContainer>
        <div className="grid gap-4">
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

export default SlugPage;
