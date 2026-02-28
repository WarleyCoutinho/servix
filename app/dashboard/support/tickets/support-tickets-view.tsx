"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Headset, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    ownedBarbershops: {
      name: string;
      subscription: { plan: string; status: string } | null;
    }[];
  };
  assignedTo?: { name: string } | null;
  messages: { content: string; createdAt: string | Date }[];
  _count: { messages: number };
}

export function SupportTicketsView({ tickets: initialTickets }: { tickets: Ticket[] }) {
  const [tickets] = useState(initialTickets);
  const [assigning, setAssigning] = useState<string | null>(null);
  const router = useRouter();

  const handleAssign = async (ticketId: string) => {
    setAssigning(ticketId);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/assign`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/dashboard/support/tickets/${ticketId}`);
      }
    } catch {
      setAssigning(null);
    }
  };

  const getStatusBadge = (ticket: Ticket) => {
    if (ticket.status === "IN_PROGRESS") {
      return (
        <div className="flex flex-col gap-1">
          <Badge variant="default" className="bg-green-600 text-xs">
            Em Atendimento
          </Badge>
          {ticket.assignedTo?.name && (
            <span className="text-[0.65rem] text-muted-foreground">
              {ticket.assignedTo.name}
            </span>
          )}
        </div>
      );
    }
    if (ticket.status === "WAITING_ADMIN") {
      return (
        <Badge variant="destructive" className="text-xs">
          Aguardando
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Aberto
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        <p className="text-muted-foreground">
          Tickets de suporte abertos e aguardando resposta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Tickets de Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Headset className="mb-4 size-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">Nenhum ticket aberto</p>
              <p className="text-sm text-muted-foreground">
                Todos os tickets foram resolvidos
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Barbearia</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagens</TableHead>
                  <TableHead>Ultima Mensagem</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const barbershop = ticket.user.ownedBarbershops[0];
                  const lastMsg = ticket.messages[0];
                  const preview = lastMsg?.content
                    ? lastMsg.content.length > 60
                      ? lastMsg.content.slice(0, 60) + "..."
                      : lastMsg.content
                    : "Sem mensagens";

                  return (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarImage src={ticket.user.image ?? ""} />
                            <AvatarFallback>
                              {ticket.user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {ticket.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {barbershop?.name ?? "Sem barbearia"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {barbershop?.subscription?.plan ?? "Sem plano"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {ticket._count.messages}
                      </TableCell>
                      <TableCell className="max-w-48 text-xs text-muted-foreground">
                        {preview}
                      </TableCell>
                      <TableCell>
                        {ticket.status === "IN_PROGRESS" ? (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/dashboard/support/tickets/${ticket.id}`}>
                              Continuar
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={assigning === ticket.id}
                            onClick={() => handleAssign(ticket.id)}
                          >
                            {assigning === ticket.id ? "Atribuindo..." : "Atender"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
