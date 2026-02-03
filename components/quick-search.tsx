"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { PageSectionScroller } from "./ui/page";
import { Scissors, Sparkles, User, Eye, Footprints, Waves } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { SearchIcon } from "lucide-react";

const QuickSearch = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchValue.trim()) return;
    router.push(`/barbershops?search=${encodeURIComponent(searchValue.trim())}`);
  };

  return (
    <>
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          className="border-border rounded-full"
          placeholder="Pesquisar"
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
      </PageSectionScroller>
    </>
  );
};

export default QuickSearch;
