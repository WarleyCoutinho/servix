"use client";

import { authClient } from "@/lib/auth-client";
import {
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Megaphone,
  MenuIcon,
  Scissors,
  Shield,
  User,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import logoDark from "@/public/servix_logo_horizontal.svg";
import logoLight from "@/public/servix_logo_light.svg";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface Category {
  label: string;
  search: string;
}

interface MenuSheetProps {
  categories?: Category[];
  onLoginClick: () => void;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const NavItem = ({ icon: Icon, label, onClick }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-muted/60"
  >
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
    <ChevronRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
  </button>
);

const MenuSheet = ({ categories = [], onLoginClick }: MenuSheetProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleNavigation = (href: string) => {
    setOpen(false);
    setTimeout(() => router.push(href), 150);
  };

  const handleLogin = () => {
    setOpen(false);
    onLoginClick();
  };

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) toast.error(error.message);
    setOpen(false);
  };

  const isLoggedIn = !!session?.user;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <MenuIcon className="size-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-[85vw] max-w-sm flex-col overflow-hidden p-0"
      >
        <div className="border-b border-border px-5 py-4">
          <Image
            src={logoLight}
            alt="Servix"
            width={140}
            height={38}
            priority
            className="block dark:hidden"
          />
          <Image
            src={logoDark}
            alt="Servix"
            width={140}
            height={38}
            priority
            className="hidden dark:block"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                <Avatar className="size-10 ring-2 ring-primary/20">
                  <AvatarImage
                    src={session.user.image ?? ""}
                    alt={session.user.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {session.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {session.user.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {session.user.email}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
                <div>
                  <p className="text-sm font-semibold">Bem-vindo!</p>
                  <p className="text-xs text-muted-foreground">
                    Faça login para continuar
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 gap-2"
                  onClick={handleLogin}
                >
                  <LogIn className="size-3.5" />
                  Entrar
                </Button>
              </div>
            )}
          </div>

          <div className="pb-2">
            <p className="px-5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Navegação
            </p>
            <NavItem
              icon={Home}
              label="Início"
              onClick={() => handleNavigation("/home")}
            />
            {!isLoggedIn && (
              <NavItem
                icon={Megaphone}
                label="Conheça o Servix"
                onClick={() => handleNavigation("/")}
              />
            )}
            {session?.user?.role === "client" && (
              <>
                <NavItem
                  icon={CalendarDays}
                  label="Meus Agendamentos"
                  onClick={() => handleNavigation("/bookings")}
                />
                <NavItem
                  icon={User}
                  label="Meu Painel"
                  onClick={() => handleNavigation("/dashboard/client")}
                />
              </>
            )}
            {(session?.user?.role === "owner" ||
              session?.user?.role === "professional" ||
              session?.user?.role === "admin") && (
              <NavItem
                icon={FileText}
                label="Manual"
                onClick={() => handleNavigation("/manual")}
              />
            )}
            {session?.user?.role === "admin" && (
              <NavItem
                icon={Shield}
                label="Administração"
                onClick={() => handleNavigation("/dashboard/admin")}
              />
            )}
            {session?.user?.role === "owner" && (
              <>
                <NavItem
                  icon={LayoutDashboard}
                  label="Painel do Estabelecimento"
                  onClick={() => handleNavigation("/dashboard/owner")}
                />
                <NavItem
                  icon={Scissors}
                  label="Painel Profissional"
                  onClick={() => handleNavigation("/dashboard/professional")}
                />
              </>
            )}
            {session?.user?.role === "professional" && (
              <NavItem
                icon={Scissors}
                label="Painel Profissional"
                onClick={() => handleNavigation("/dashboard/professional")}
              />
            )}
          </div>

          {categories.length > 0 && (
            <div className="pb-4">
              <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Categorias
              </p>
              <div className="grid grid-cols-2 gap-1.5 px-5 pt-1">
                {categories.map((category) => (
                  <button
                    key={category.search}
                    type="button"
                    onClick={() =>
                      handleNavigation(`/barbershops?search=${category.search}`)
                    }
                    className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isLoggedIn && (
          <div className="shrink-0 border-t border-border p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
              Sair da conta
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MenuSheet;
