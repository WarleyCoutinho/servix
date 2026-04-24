/**
 * app/b/[slug]/layout.tsx
 *
 * O cookie store-context é setado pelo middleware.ts ao interceptar /b/[slug].
 * Este layout não precisa fazer nada além de renderizar os filhos.
 */
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
