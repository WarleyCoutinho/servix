import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const INVALID_SLUGS = ["home", "marketing"];

export default async function RootPage() {
  const cookieStore = await cookies();

  const storeSlug = cookieStore.get("barbershop_slug")?.value;

  // usuário veio de uma loja válida
  if (storeSlug && !INVALID_SLUGS.includes(storeSlug)) {
    redirect(`/${storeSlug}`);
  }

  // visitante normal
  redirect("/marketing");
}
