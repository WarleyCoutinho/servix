"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ServiceItem from "@/components/service-item";
import { Barbershop, BarbershopService } from "@/generated/prisma/client";

interface ServicesSectionProps {
  services: BarbershopService[];
  barbershop: Barbershop;
  isOwner: boolean;
  isProfessional: boolean;
}

type SortKey =
  | "name-asc"
  | "name-desc"
  | "duration-asc"
  | "duration-desc"
  | "price-asc"
  | "price-desc";

type PriceTab = "all" | "budget" | "mid" | "premium";

const SORT_LABELS: Record<SortKey, string> = {
  "name-asc": "Nome (A → Z)",
  "name-desc": "Nome (Z → A)",
  "duration-asc": "Duração (menor)",
  "duration-desc": "Duração (maior)",
  "price-asc": "Preço (menor)",
  "price-desc": "Preço (maior)",
};

const TAB_LABELS: Record<PriceTab, string> = {
  all: "Todos",
  budget: "Até R$ 50",
  mid: "R$ 50–100",
  premium: "Acima de R$ 100",
};

function getPriceTab(cents: number): PriceTab {
  if (cents <= 5000) return "budget";
  if (cents <= 10000) return "mid";
  return "premium";
}

export function ServicesSection({
  services,
  barbershop,
  isOwner,
  isProfessional,
}: ServicesSectionProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [activeTab, setActiveTab] = useState<PriceTab>("all");

  const availableTabs = useMemo<PriceTab[]>(() => {
    const tabs = new Set<PriceTab>(["all"]);
    services.forEach((s) => tabs.add(getPriceTab(s.priceInCents)));
    return (["all", "budget", "mid", "premium"] as PriceTab[]).filter((t) =>
      tabs.has(t),
    );
  }, [services]);

  const filtered = useMemo(() => {
    let list = [...services];

    if (activeTab !== "all") {
      list = list.filter((s) => getPriceTab(s.priceInCents) === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name, "pt-BR");
        case "name-desc":
          return b.name.localeCompare(a.name, "pt-BR");
        case "duration-asc":
          return a.durationMinutes - b.durationMinutes;
        case "duration-desc":
          return b.durationMinutes - a.durationMinutes;
        case "price-asc":
          return a.priceInCents - b.priceInCents;
        case "price-desc":
          return b.priceInCents - a.priceInCents;
      }
    });

    return list;
  }, [services, activeTab, search, sort]);

  return (
    <section className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Serviços</h2>
        <Badge variant="secondary" className="text-xs">
          {filtered.length} de {services.length}
        </Badge>
      </div>

      {/* Busca + Ordenação */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1.5"
            >
              <ArrowUpDown className="size-3.5" />
              <span className="hidden text-xs sm:inline">
                {SORT_LABELS[sort]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(v) => setSort(v as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuRadioItem
                  key={key}
                  value={key}
                  className="text-sm"
                >
                  {SORT_LABELS[key]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs por faixa de preço */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as PriceTab)}
      >
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {availableTabs.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="h-8 rounded-full border border-border/60 px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
                <Search className="mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  Nenhum serviço encontrado
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Tente outro termo ou faixa de preço
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {filtered.map((service) => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    barbershop={barbershop}
                    isOwner={isOwner}
                    isProfessional={isProfessional}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
