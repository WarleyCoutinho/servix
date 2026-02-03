import { Card, CardContent } from "./ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingSummaryProps {
  serviceName: string;
  servicePrice: number;
  barbershopName: string;
  date: Date;
  time?: string;
}

const BookingSummary = ({
  serviceName,
  servicePrice,
  barbershopName,
  date,
  time,
}: BookingSummaryProps) => {
  const formattedTime = time ?? format(date, "HH:mm");

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold">{serviceName}</p>
          <p className="text-sm font-bold">{formatCurrency(servicePrice)}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Data</p>
          <p className="text-sm">
            {format(date, "d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Horário</p>
          <p className="text-sm">{formattedTime}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Barbearia</p>
          <p className="text-sm">{barbershopName}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
