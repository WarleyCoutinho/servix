import { Card, CardContent } from "./ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingSummaryProps {
  serviceName: string;
  servicePrice: number;
  barbershopName: string;
  professionalName?: string;
  date: Date;
  time?: string;
}

const BookingSummary = ({
  serviceName,
  servicePrice,
  barbershopName,
  professionalName,
  date,
  time,
}: BookingSummaryProps) => {
  const formattedTime = time ?? format(date, "HH:mm");

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-primary/5 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
          Resumo do Agendamento
        </p>
      </div>
      <CardContent className="divide-y divide-border px-0 pb-0">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-muted-foreground">Servico</p>
          <p className="text-sm font-medium">{serviceName}</p>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-muted-foreground">Data</p>
          <p className="text-sm font-medium">
            {format(date, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-muted-foreground">Horario</p>
          <p className="text-sm font-medium">{formattedTime}</p>
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-muted-foreground">Barbearia</p>
          <p className="text-sm font-medium">{barbershopName}</p>
        </div>
        {professionalName && (
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-sm text-muted-foreground">Profissional</p>
            <p className="text-sm font-medium">{professionalName}</p>
          </div>
        )}
        <div className="flex items-center justify-between bg-muted/50 px-5 py-3">
          <p className="text-sm font-semibold">Total</p>
          <p className="text-sm font-bold text-primary">
            {formatCurrency(servicePrice)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
