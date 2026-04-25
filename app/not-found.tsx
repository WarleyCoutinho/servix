/* // app/not-found.tsx
import { NotFoundContent } from "@/components/not-found-content";
import { STORE_CONTEXT_COOKIE } from "@/proxy";
import { cookies } from "next/headers";

export default async function NotFound() {
  const cookieStore = await cookies();
  const storeSlug = cookieStore.get(STORE_CONTEXT_COOKIE)?.value ?? null;

  return <NotFoundContent storeSlug={storeSlug} />;
} */

// app/not-found.tsx
import { NotFoundContent } from "@/components/not-found-content";

export default function NotFound() {
  return <NotFoundContent />;
}
