"use client";

import { authClient } from "@/lib/auth-client";
import { useStoreContext } from "@/hooks/use-store-context";

import logoDark from "@/public/servix_logo_horizontal.svg";
import logoLight from "@/public/servix_logo_light.svg";

import {
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Megaphone,
  Scissors,
  Shield,
  User,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";

import { useState, useSyncExternalStore } from "react";

import { toast } from "sonner";

import LoginModal from "./login-modal";
import MenuSheet from "./menu-sheet";
import { ThemeToggle } from "./theme-toggle";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Header = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: session } = authClient.useSession();

  const isLoggedIn = !!session?.user;

  const { storeUrl } = useStoreContext();

  // evita hydration mismatch no Next 16 / React 19
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const safeStoreUrl = isClient ? storeUrl : null;

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      await authClient.signOut();

      window.location.href = "/marketing";
    } catch {
      toast.error("Erro ao sair da conta");
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-background border-border sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href={safeStoreUrl || "/"} className="shrink-0">
            <Image
              src={logoLight}
              alt="Servix"
              height={54}
              width={200}
              priority
              className="block h-7 w-auto min-[375px]:h-8 md:h-9 dark:hidden"
            />

            <Image
              src={logoDark}
              alt="Servix"
              height={54}
              width={200}
              priority
              className="hidden h-7 w-auto min-[375px]:h-8 md:h-9 dark:block"
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {session?.user?.role === "admin" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/home">
                  <Home className="mr-2 size-4" />
                  Início
                </Link>
              </Button>
            )}

            {safeStoreUrl && (
              <Button asChild variant="ghost" size="sm">
                <Link href={safeStoreUrl}>
                  <Home className="mr-2 size-4" />

                  {session?.user?.role === "owner" ||
                  session?.user?.role === "professional"
                    ? "Voltar à loja"
                    : "Página inicial"}
                </Link>
              </Button>
            )}

            {session?.user?.role === "client" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/bookings">
                  <CalendarDays className="mr-2 size-4" />
                  Meus Agendamentos
                </Link>
              </Button>
            )}

            {!isLoggedIn && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/marketing">
                  <Megaphone className="mr-2 size-4" />
                  Conheça o Servix
                </Link>
              </Button>
            )}

            {(session?.user?.role === "owner" ||
              session?.user?.role === "professional" ||
              session?.user?.role === "admin") && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/manual">
                  <FileText className="mr-2 size-4" />
                  Manual
                </Link>
              </Button>
            )}

            {session?.user?.role === "admin" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin">
                  <Shield className="mr-2 size-4" />
                  Administração
                </Link>
              </Button>
            )}

            {session?.user?.role === "owner" && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/owner">
                    <LayoutDashboard className="mr-2 size-4" />
                    Estabelecimento
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/professional">
                    <Scissors className="mr-2 size-4" />
                    Profissional
                  </Link>
                </Button>
              </>
            )}

            {session?.user?.role === "professional" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/professional">
                  <Scissors className="mr-2 size-4" />
                  Profissional
                </Link>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden md:block">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="size-9">
                      {session.user.image && (
                        <AvatarImage
                          src={session.user.image}
                          alt={session.user.name}
                        />
                      )}

                      <AvatarFallback>
                        {session.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>

                      <p className="text-muted-foreground text-xs">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {session.user.role === "client" && (
                    <DropdownMenuItem asChild>
                      <Link href="/bookings">
                        <CalendarDays className="mr-2 size-4" />
                        Meus Agendamentos
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {session.user.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/admin">
                        <Shield className="mr-2 size-4" />
                        Painel Administrativo
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {session.user.role === "owner" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/owner">
                          <LayoutDashboard className="mr-2 size-4" />
                          Painel do Estabelecimento
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/professional">
                          <Scissors className="mr-2 size-4" />
                          Painel Profissional
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {session.user.role === "professional" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/professional">
                        <Scissors className="mr-2 size-4" />
                        Painel Profissional
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {session.user.role === "client" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/client">
                        <User className="mr-2 size-4" />
                        Meu Painel
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {(session.user.role === "owner" ||
                    session.user.role === "professional" ||
                    session.user.role === "admin") && (
                    <>
                      <DropdownMenuSeparator />

                      <DropdownMenuItem asChild>
                        <Link href="/manual">
                          <FileText className="mr-2 size-4" />
                          Manual
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />

                    {isLoggingOut ? "Saindo..." : "Sair da conta"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => setLoginModalOpen(true)}>
                <LogIn className="mr-2 size-4" />
                Entrar
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <MenuSheet onLoginClick={() => setLoginModalOpen(true)} />
          </div>
        </div>
      </div>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </header>
  );
};

export default Header;
