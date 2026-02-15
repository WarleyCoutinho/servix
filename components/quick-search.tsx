"use client";

import { SearchIcon, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PageSectionScroller } from "./ui/page";

interface Category {
  label: string;
  search: string;
}

interface QuickSearchProps {
  categories?: Category[];
}

const QuickSearch = ({ categories = [] }: QuickSearchProps) => {
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
      {categories.length > 0 && (
        <PageSectionScroller>
          {categories.map((category) => (
            <Link
              key={category.search}
              href={`/barbershops?search=${encodeURIComponent(category.search)}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground/70 shadow-xs transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              <Tag className="size-4" />
              <span className="text-card-foreground text-sm font-medium">
                {category.label}
              </span>
            </Link>
          ))}
        </PageSectionScroller>
      )}
    </>
  );
};

export default QuickSearch;
