"use client";

import { authClient } from "@/lib/auth-client";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  MenuIcon,
  Scissors,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface Category {
  label: string;
  search: string;
}

interface MenuSheetProps {
  categories?: Category[];
  onLoginClick: () => void;
}

const MenuSheet = ({ categories = [], onLoginClick }: MenuSheetProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const handleNavigation = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleLogin = () => {
    setOpen(false);
    onLoginClick();
  };

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message);
    }
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
        side="left"
        className="flex w-[85vw] max-w-sm flex-col overflow-hidden p-0"
      >
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4 text-left sm:px-6">
          <SheetTitle className="text-lg">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 py-4 sm:gap-6 sm:py-6">
            <div className="px-4 sm:px-6">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 sm:size-12">
                    <AvatarImage
                      src={session.user.image ?? ""}
                      alt={session.user.name}
                    />
                    <AvatarFallback className="text-sm sm:text-base">
                      {session.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold sm:text-base">
                      {session.user.name}
                    </span>
                    <span className="text-muted-foreground truncate text-xs sm:text-sm">
                      {session.user.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold sm:text-base">
                    Olá. Faça seu login!
                  </p>
                  <Button
                    size="sm"
                    className="shrink-0 gap-2"
                    onClick={handleLogin}
                  >
                    <LogIn className="size-4" />
                    Login
                  </Button>
                </div>
              )}
            </div>

            <div className="border-border border-b" />

            <nav className="flex flex-col">
              <button
                type="button"
                onClick={() => handleNavigation("/")}
                className="hover:bg-accent flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-6"
              >
                <Home className="size-4 shrink-0" />
                Início
              </button>

              {session?.user?.role === "owner" && (
                <button
                  type="button"
                  onClick={() => handleNavigation("/dashboard/owner")}
                  className="hover:bg-accent flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-6"
                >
                  <LayoutDashboard className="size-4 shrink-0" />
                  Painel do Proprietário
                </button>
              )}

              {session?.user?.role === "professional" && (
                <button
                  type="button"
                  onClick={() => handleNavigation("/dashboard/professional")}
                  className="hover:bg-accent flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-6"
                >
                  <Scissors className="size-4 shrink-0" />
                  Painel do Profissional
                </button>
              )}

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => handleNavigation("/bookings")}
                  className="hover:bg-accent flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-6"
                >
                  <CalendarDays className="size-4 shrink-0" />
                  Meus Agendamentos
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNavigation("/chat")}
                className="hover:bg-accent flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors sm:px-6"
              >
                <Sparkles className="size-4 shrink-0" />
                Assistente IA
              </button>
            </nav>

            <div className="border-border border-b" />

            <div className="flex flex-col">
              <p className="text-muted-foreground px-4 pb-2 text-xs font-medium uppercase tracking-wider sm:px-6">
                Categorias
              </p>
              <div className="grid grid-cols-2 gap-1 px-2 sm:grid-cols-1 sm:gap-0 sm:px-0">
                {categories.map((category) => (
                  <button
                    key={category.search}
                    type="button"
                    onClick={() =>
                      handleNavigation(`/barbershops?search=${category.search}`)
                    }
                    className="hover:bg-accent rounded-md px-2 py-2.5 text-left text-sm font-medium transition-colors sm:rounded-none sm:px-6 sm:py-3"
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoggedIn && (
          <div className="border-border shrink-0 border-t p-4 sm:p-6">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 size-4" />
              Sair da conta
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MenuSheet;
