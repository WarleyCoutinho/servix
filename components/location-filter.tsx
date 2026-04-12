"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Location {
  city: string;
  state: string;
}

interface LocationFilterProps {
  locations: Location[];
  currentCity?: string;
  currentState?: string;
}

export function LocationFilter({
  locations,
  currentCity,
  currentState,
}: LocationFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const states = [...new Set(locations.map((l) => l.state))].sort();

  const citiesForState = currentState
    ? locations
        .filter((l) => l.state === currentState)
        .map((l) => l.city)
        .sort()
    : [];

  const updateParams = useCallback(
    (key: string, value: string | null, clearKeys?: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (clearKeys) {
        clearKeys.forEach((k) => params.delete(k));
      }
      const query = params.toString();
      router.push(query ? `/?${query}` : "/");
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>Filtrar por localização:</span>
      </div>
      <div className="flex gap-2">
        <Select
          value={currentState || ""}
          onValueChange={(value) => {
            if (value === "all") {
              updateParams("state", null, ["city"]);
            } else {
              updateParams("state", value, ["city"]);
            }
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {states.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {currentState && citiesForState.length > 0 && (
          <Select
            value={currentCity || ""}
            onValueChange={(value) => {
              if (value === "all") {
                updateParams("city", null);
              } else {
                updateParams("city", value);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as cidades</SelectItem>
              {citiesForState.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
