"use client";

import { authClient } from "@/lib/auth-client";
import { CalendarDays, Home, LogIn, LogOut, MenuIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const categories = [
  { label: "Cabelo", search: "cabelo" },
  { label: "Barba", search: "barba" },
  { label: "Acabamento", search: "acabamento" },
  { label: "Sobrancelha", search: "sobrancelha" },
  { label: "Massagem", search: "massagem" },
  { label: "Hidratacao", search: "hidratacao" },
];

const MenuSheet = () => {
  const { data: session } = authClient.useSession();
  const handleLogin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
  };
  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
  };
  const isLoggedIn = !!session?.user;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="border-border border-b px-5 py-6 text-left">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 py-6">
          <div className="flex items-center justify-between px-5">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarImage
                    src={session.user.image ?? ""}
                    alt={session.user.name}
                  />
                  <AvatarFallback>
                    {session.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{session.user.name}</span>
                  <span className="text-muted-foreground text-sm">
                    {session.user.email}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold">Olá. Faça seu login!</p>
                <Button className="gap-3 rounded-full" onClick={handleLogin}>
                  Login
                  <LogIn className="size-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-col">
            <SheetClose asChild>
              <Link
                href="/"
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium"
              >
                <Home className="size-4" />
                Início
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/bookings"
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium"
              >
                <CalendarDays className="size-4" />
                Agendamentos
              </Link>
            </SheetClose>
          </div>

          <div className="border-border border-b" />

          <div className="flex flex-col gap-1">
            {categories.map((category) => (
              <SheetClose key={category.search} asChild>
                <Link
                  href={`/barbershops?search=${category.search}`}
                  className="px-5 py-3 text-sm font-medium"
                >
                  {category.label}
                </Link>
              </SheetClose>
            ))}
          </div>

          <div className="border-border border-b" />

          {isLoggedIn && (
            <Button
              variant="ghost"
              className="justify-left w-fit text-left"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sair da conta
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuSheet;
