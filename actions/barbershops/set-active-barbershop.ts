"use server";

import { z } from "zod";
import { ownerActionClient } from "@/lib/action-client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const ACTIVE_BARBERSHOP_COOKIE = "active-barbershop-id";

const inputSchema = z.object({
  barbershopId: z.string().uuid("ID do estabelecimento inválido"),
});

export const setActiveBarbershop = ownerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { ownedBarbershops, allBarbershops } }) => {
    const allBarbershop = allBarbershops?.find(
      (b) => b.id === parsedInput.barbershopId,
    );

    if (!allBarbershop) {
      throw new Error("Estabelecimento não encontrado ou não pertence a você.");
    }

    if (!allBarbershop.isActive) {
      throw new Error(
        "Este estabelecimento está desativado. Faça upgrade do seu plano para reativá-lo.",
      );
    }

    const barbershop = ownedBarbershops.find(
      (b) => b.id === parsedInput.barbershopId,
    );

    if (!barbershop) {
      throw new Error("Estabelecimento não encontrado ou não pertence a você.");
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BARBERSHOP_COOKIE, barbershop.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });

    revalidatePath("/dashboard/owner");

    return {
      success: true,
      barbershop,
      message: `Loja "${barbershop.name}" selecionada!`,
    };
  });

export async function getActiveBarbershopId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_BARBERSHOP_COOKIE)?.value;
}
