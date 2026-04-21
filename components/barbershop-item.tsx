import { Barbershop } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

interface BarbershopItemProps {
  barbershop: Barbershop;
  className?: string;
}

const BarbershopItem = ({ barbershop, className }: BarbershopItemProps) => {
  return (
    <Link
      href={`/barbershops/${barbershop.id}`}
      className={cn(
        "group relative block w-65 shrink-0 snap-start overflow-hidden rounded-2xl border border-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-4/3">
        <div className="absolute inset-0 z-10 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
        <h3 className="truncate text-base font-bold text-white">
          {barbershop.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-white/70">
          {barbershop.address}
          {barbershop.city && barbershop.state
            ? ` — ${barbershop.city}/${barbershop.state}`
            : ""}
        </p>
      </div>
    </Link>
  );
};

export default BarbershopItem;
