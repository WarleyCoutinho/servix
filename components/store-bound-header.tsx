"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useStoreContext } from "@/hooks/use-store-context";
// better-auth@1.4.6: useSession e signOut ficam no authClient criado com createAuthClient()
import { authClient } from "@/lib/auth-client";
import { Calendar, Globe, LogIn, LogOut, Menu } from "lucide-react";
import Link from "next/link";

interface StoreBoundHeaderProps {
  storeSlug: string;
  storeName: string;
  storeLogoUrl?: string | null;
}

export function StoreBoundHeader({
  storeSlug,
  storeName,
  storeLogoUrl,
}: StoreBoundHeaderProps) {
  // useSession vem do authClient — NÃO importar separado
  const { data: session } = authClient.useSession();
  const { exitStore } = useStoreContext();
  const user = session?.user;

  const storeHome = `/b/${storeSlug}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href={storeHome}
          className="flex items-center gap-2 font-semibold"
        >
          {storeLogoUrl && (
            <img
              src={storeLogoUrl}
              alt={storeName}
              className="size-7 rounded-full object-cover"
            />
          )}
          <span className="max-w-[160px] truncate text-sm">{storeName}</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="size-7">
                    <AvatarImage src={user.image ?? undefined} />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {user.name}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`${storeHome}#agendamentos`}>
                    <Calendar className="mr-2 size-4" />
                    Meus agendamentos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exitStore("/")}>
                  <Globe className="mr-2 size-4" />
                  Ver todas as lojas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => authClient.signOut()}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 pt-6">
                  <p className="text-sm text-muted-foreground">
                    Faça login para agendar
                  </p>
                  <Button asChild>
                    <Link href={`/login?redirect=/b/${storeSlug}`}>
                      <LogIn className="mr-2 size-4" />
                      Entrar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exitStore("/")}
                    className="text-muted-foreground"
                  >
                    <Globe className="mr-2 size-4" />
                    Ver todas as lojas
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
