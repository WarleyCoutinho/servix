"use client";

import {
  Droplet,
  Eye,
  Flower2,
  Footprints,
  Gem,
  HandMetal,
  Heart,
  Paintbrush,
  Scissors,
  SearchIcon,
  Smile,
  Sparkles,
  User,
  Waves,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PageSectionScroller } from "./ui/page";

const QuickSearch = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    router.push(
      `/barbershops?search=${encodeURIComponent(searchValue.trim())}`,
    );
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          className="border-border rounded-full"
          placeholder="Pesquisar serviços"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Button type="submit" className="h-10 w-10 rounded-full">
          <SearchIcon />
        </Button>
      </form>
      <PageSectionScroller>
        <Link
          href="/barbershops?search=cabelo"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Scissors className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Cabelo
          </span>
        </Link>

        <Link
          href="/barbershops?search=barba"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <User className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Barba
          </span>
        </Link>

        <Link
          href="/barbershops?search=acabamento"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Sparkles className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Acabamento
          </span>
        </Link>

        <Link
          href="/barbershops?search=sobrancelha"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Eye className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Sobrancelha
          </span>
        </Link>

        <Link
          href="/barbershops?search=pézinho"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Footprints className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Pézinho
          </span>
        </Link>

        <Link
          href="/barbershops?search=progressiva"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Waves className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Progressiva
          </span>
        </Link>

        <Link
          href="/barbershops?search=coloração"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Paintbrush className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Coloração
          </span>
        </Link>

        <Link
          href="/barbershops?search=hidratação"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Droplet className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Hidratação
          </span>
        </Link>

        <Link
          href="/barbershops?search=manicure"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <HandMetal className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Manicure
          </span>
        </Link>

        <Link
          href="/barbershops?search=pedicure"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Flower2 className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Pedicure
          </span>
        </Link>

        <Link
          href="/barbershops?search=depilação"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Zap className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Depilação
          </span>
        </Link>

        <Link
          href="/barbershops?search=limpeza de pele"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Smile className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Limpeza de Pele
          </span>
        </Link>

        <Link
          href="/barbershops?search=massagem"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Heart className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Massagem
          </span>
        </Link>

        <Link
          href="/barbershops?search=design de sobrancelha"
          className="border-border bg-card-background flex shrink-0 items-center justify-center gap-3 rounded-3xl border px-4 py-2"
        >
          <Gem className="size-4" />
          <span className="text-card-foreground text-sm font-medium">
            Design de Sobrancelha
          </span>
        </Link>
      </PageSectionScroller>
    </>
  );
};

export default QuickSearch;
