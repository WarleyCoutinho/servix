import { Card, CardContent } from "./ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingSummaryProps {
  serviceName: string;
  servicePrice: number;
  barbershopName: string;
  professionalName?: string;
  clientName?: string | null;
  date: Date;
  time?: string;
}

const BookingSummary = ({
  serviceName,
  servicePrice,
  barbershopName,
  professionalName,
  clientName,
  date,
  time,
}: BookingSummaryProps) => {
  const formattedTime = time ?? format(date, "HH:mm");

  return (
    <Card className="overflow-hidden">
      {/* Cabeçalho do resumo */}
      <div className="border-b bg-primary/5 px-5 py-3">
        <p className="text-primary/80 text-xs font-semibold uppercase tracking-wide">
          Resumo do Agendamento
        </p>
      </div>

      {/*
        FIX: CardContent com padding explícito zerado (p-0) para que
        divide-y funcione sem gap — o padding padrão do shadcn (p-6)
        cria espaço extra que quebra as divisórias visuais.
        Cada linha tem seu próprio px-5 py-3.
      */}
      <CardContent className="divide-y divide-border p-0">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-muted-foreground text-sm">Serviço</p>
          <p className="text-sm font-medium">{serviceName}</p>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-muted-foreground text-sm">Data</p>
          <p className="text-sm font-medium">
            {format(date, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-muted-foreground text-sm">Horário</p>
          <p className="text-sm font-medium">{formattedTime}</p>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-muted-foreground text-sm">Barbearia</p>
          {/* truncate evita overflow em nomes longos em telas pequenas */}
          <p className="max-w-[55%] truncate text-right text-sm font-medium">
            {barbershopName}
          </p>
        </div>

        {professionalName && (
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-muted-foreground text-sm">Profissional</p>
            <p className="max-w-[55%] truncate text-right text-sm font-medium">
              {professionalName}
            </p>
          </div>
        )}

        {clientName && (
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-muted-foreground text-sm">Cliente</p>
            <p className="max-w-[55%] truncate text-right text-sm font-medium">
              {clientName}
            </p>
          </div>
        )}

        {/* Linha de total com destaque */}
        <div className="flex items-center justify-between bg-muted/50 px-5 py-3">
          <p className="text-sm font-semibold">Total</p>
          <p className="text-primary text-sm font-bold">
            {formatCurrency(servicePrice)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
