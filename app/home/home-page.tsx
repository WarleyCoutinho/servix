import Footer from "@/components/footer";
import Header from "@/components/header";
import bannerDark from "@/public/servix_dark.png";
import bannerLight from "@/public/servix_light.png";
import { getServiceCategories } from "@/data/services";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserBarbershops } from "@/data/barbershops";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";
import BarbershopItem from "@/components/barbershop-item";
import { PageSectionScroller } from "@/components/ui/page";
import { getUserBookings } from "@/data/bookings";
import BookingItem from "@/components/booking-item";
import { Suspense } from "react";
import { AuthErrorAlert } from "@/components/auth-error-alert";

/**
 * Rota "/"
 *
 * - Usuário não logado            → página de marketing (landing page)
 * - Usuário logado como owner/pro → dashboard com seus estabelecimentos
 * - Usuário logado como cliente   → lista de todas as lojas (comportamento original)
 *
 * Quem chegou pelo link /b/[slug] NUNCA vê esta página diretamente:
 * o middleware.ts redireciona "/" → "/b/[slug]" enquanto o cookie existir.
 */

const Banner = ({ children }: { children?: React.ReactNode }) => (
  <div className="relative overflow-hidden rounded-2xl">
    <Image
      src={bannerDark}
      alt="Agende nos melhores com a Servix"
      sizes="(max-width: 768px) 100vw, 1024px"
      className="hidden h-auto w-full rounded-2xl dark:block"
      priority
    />
    <Image
      src={bannerLight}
      alt="Agende nos melhores com a Servix"
      sizes="(max-width: 768px) 100vw, 1024px"
      className="block h-auto w-full rounded-2xl dark:hidden"
      priority
    />
    <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-black/60 via-black/30 to-transparent" />
    {children && (
      <div className="absolute bottom-[8%] left-4 right-4 sm:bottom-[10%] sm:left-8 md:bottom-[12%]">
        {children}
      </div>
    )}
  </div>
);

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  const role = session?.user?.role as string | undefined;
  const userId = session?.user?.id;
  const isRestricted = role === "owner" || role === "professional";

  // ── Owner / Professional ──────────────────────────────────────────────────
  if (isRestricted && userId) {
    const [myBarbershops, { confirmedBookings }, categories] =
      await Promise.all([
        getUserBarbershops(userId, role!),
        getUserBookings(),
        getServiceCategories(),
      ]);

    return (
      <div className="flex min-h-screen flex-col">
        <Header categories={categories} />
        <PageContainer>
          <Suspense fallback={null}>
            <AuthErrorAlert />
          </Suspense>
          <Banner />

          {confirmedBookings.length > 0 && (
            <PageSectionContent>
              <PageSectionTitle>Agendamentos</PageSectionTitle>
              <PageSectionScroller>
                {confirmedBookings.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </PageSectionScroller>
            </PageSectionContent>
          )}

          <PageSectionContent>
            <PageSectionTitle>
              {role === "owner"
                ? "Meus Estabelecimentos"
                : "Meu Estabelecimento"}
            </PageSectionTitle>
            {myBarbershops.length > 0 ? (
              <PageSectionScroller>
                {myBarbershops.map((barbershop) => (
                  <BarbershopItem key={barbershop.id} barbershop={barbershop} />
                ))}
              </PageSectionScroller>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum estabelecimento encontrado.
              </p>
            )}
          </PageSectionContent>
        </PageContainer>
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    );
  }

  // ── Usuário cliente logado ────────────────────────────────────────────────
  if (session?.user && !isRestricted) {
    // Cliente logado sem contexto de loja → mostra landing marketing
    // (ele chegou aqui organicamente, não pelo link de uma loja)
    redirect("/home");
  }

  // ── Não logado / Marketing ────────────────────────────────────────────────
  const categories = await getServiceCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={categories} />
      <PageContainer>
        <Suspense fallback={null}>
          <AuthErrorAlert />
        </Suspense>

        {/* Hero / Banner de marketing */}
        <Banner>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-white/90">
              Agende serviços nos melhores estabelecimentos
            </p>
            <div className="flex gap-2">
              <Button asChild size="sm" className="w-fit">
                <Link href="/login">Começar agora</Link>
              </Button>
            </div>
          </div>
        </Banner>

        {/*
         * Aqui você coloca o conteúdo da landing page de marketing:
         * seção "como funciona", depoimentos, CTA, etc.
         *
         * Não listamos todas as lojas pois a "/" agora é marketing,
         * não um diretório público de estabelecimentos.
         */}
        <PageSectionContent>
          <PageSectionTitle>
            Junte-se aos clientes que já confiam na Servix
          </PageSectionTitle>
          <p className="text-sm text-muted-foreground">
            Acesse o link do seu estabelecimento favorito e agende em segundos.
          </p>
        </PageSectionContent>
      </PageContainer>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
