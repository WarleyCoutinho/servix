import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { ConnectedAccountsManager } from "./connected-accounts-manager";
import type Stripe from "stripe";

interface ConnectedAccountData {
  id: string;
  email: string | null;
  businessName: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  type: string;
  created: number;
  professionalName: string | null;
  professionalId: string | null;
  barbershopName: string | null;
  requirements: {
    currentlyDue: string[];
    disabledReason: string | null;
  };
}

export default async function ConnectedAccountsPage() {
  const accounts: Stripe.Account[] = [];
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const params: Stripe.AccountListParams = { limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;

    const response = await stripe.accounts.list(params);
    accounts.push(...response.data);
    hasMore = response.has_more;
    if (hasMore && response.data.length > 0) {
      startingAfter = response.data[response.data.length - 1].id;
    }
  }

  const stripeAccountIds = accounts.map((a) => a.id).filter(Boolean);

  const professionals = await prisma.professional.findMany({
    where: {
      stripeAccountId: { in: stripeAccountIds },
    },
    select: {
      stripeAccountId: true,
      id: true,
      user: { select: { name: true } },
      barbershop: { select: { name: true } },
    },
  });

  const profByStripeId = new Map(
    professionals.map((p) => [p.stripeAccountId, p]),
  );

  const connectedAccounts: ConnectedAccountData[] = accounts.map((acc) => {
    const prof = profByStripeId.get(acc.id);
    return {
      id: acc.id,
      email: acc.email ?? null,
      businessName: acc.business_profile?.name ?? null,
      chargesEnabled: acc.charges_enabled ?? false,
      payoutsEnabled: acc.payouts_enabled ?? false,
      detailsSubmitted: acc.details_submitted ?? false,
      type: acc.type ?? "custom",
      created: acc.created ?? 0,
      professionalName: prof?.user.name ?? null,
      professionalId: prof?.id ?? null,
      barbershopName: prof?.barbershop.name ?? null,
      requirements: {
        currentlyDue: acc.requirements?.currently_due ?? [],
        disabledReason: acc.requirements?.disabled_reason ?? null,
      },
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contas Conectadas</h1>
        <p className="text-muted-foreground">
          Gerencie as contas Stripe Connect dos profissionais
        </p>
      </div>

      <ConnectedAccountsManager initialAccounts={connectedAccounts} />
    </div>
  );
}
