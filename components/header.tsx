"use client";

import { authClient } from "@/lib/auth-client";
import logo from "@/public/logo-sem-fundo.png";
import {
  BotMessageSquare,
  CalendarDays,
  ChevronDown,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Scissors,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import LoginModal from "./login-modal";
import MenuSheet from "./menu-sheet";
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

interface Category {
  label: string;
  search: string;
}

interface HeaderProps {
  categories?: Category[];
}

const Header = ({ categories = [] }: HeaderProps) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  const handleLogout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <header className="bg-background border-border sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          {/* <Link href="/" className="shrink-0">
            <Image src="/logo.svg" alt="Servix" width={91} height={24} />
          </Link> */}
          <Link href="/" className="shrink-0">
            <Image
              src={logo}
              alt="logo marca para negócios de beleza"
              width={150}
              height={28}
              priority
            />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <Home className="mr-2 size-4" />
                Início
              </Link>
            </Button>

            {categories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Categorias
                    <ChevronDown className="ml-1 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.search} asChild>
                      <Link
                        href={`/barbershops?search=${encodeURIComponent(category.search)}`}
                      >
                        {category.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isLoggedIn && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/bookings">
                  <CalendarDays className="mr-2 size-4" />
                  Agendamentos
                </Link>
              </Button>
            )}

            {session?.user?.role === "owner" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/owner">
                  <LayoutDashboard className="mr-2 size-4" />
                  Painel
                </Link>
              </Button>
            )}

            {session?.user?.role === "professional" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/professional">
                  <Scissors className="mr-2 size-4" />
                  Painel
                </Link>
              </Button>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hidden sm:flex"
          >
            <Link href="/chat">
              <BotMessageSquare className="size-5" />
            </Link>
          </Button>

          <div className="hidden md:block">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="size-9">
                      <AvatarImage
                        src={session.user.image ?? ""}
                        alt={session.user.name}
                      />
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
                  <DropdownMenuItem asChild>
                    <Link href="/bookings">
                      <CalendarDays className="mr-2 size-4" />
                      Meus Agendamentos
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === "owner" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/owner">
                        <LayoutDashboard className="mr-2 size-4" />
                        Painel do Proprietário
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "professional" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/professional">
                        <Scissors className="mr-2 size-4" />
                        Painel do Profissional
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 size-4" />
                    Sair da conta
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
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <BotMessageSquare className="size-5" />
              </Link>
            </Button>
            <MenuSheet
              categories={categories}
              onLoginClick={() => setLoginModalOpen(true)}
            />
          </div>
        </div>
      </div>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </header>
  );
};

export default Header;
