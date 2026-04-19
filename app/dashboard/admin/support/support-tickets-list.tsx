"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Headset, Clock, CheckCircle, AlertTriangle, MessageSquare, Users } from "lucide-react";
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
import Link from "next/link";

interface TicketUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  ownedBarbershops: {
    name: string;
    subscription: {
      plan: string;
      status: string;
    } | null;
  }[];
}

interface Ticket {
  id: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: TicketUser;
  assignedTo?: { name: string } | null;
  messages: { content: string; createdAt: string | Date }[];
  _count: { messages: number };
}

interface Stats {
  total: number;
  waitingAdmin: number;
  inProgress: number;
  resolvedToday: number;
}

export function SupportTicketsList({
  initialTickets,
  stats,
}: {
  initialTickets: Ticket[];
  stats: Stats;
}) {
  const [tickets, setTickets] = useState(initialTickets);
  const [assigning, setAssigning] = useState<string | null>(null);
  const router = useRouter();

  const statCards = [
    {
      title: "Tickets Abertos",
      value: stats.total,
      icon: Headset,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Aguardando Admin",
      value: stats.waitingAdmin,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Em Atendimento",
      value: stats.inProgress,
      icon: Clock,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Resolvidos Hoje",
      value: stats.resolvedToday,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  const handleAssign = async (ticketId: string) => {
    setAssigning(ticketId);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/assign`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/dashboard/admin/support/${ticketId}`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suporte</h1>
          <p className="text-muted-foreground">
            Gerencie os tickets de suporte dos clientes
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/support/team">
            <Users className="mr-2 size-4" />
            Equipe de Suporte
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden transition-shadow hover:shadow-md">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
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
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="hidden md:table-cell">Barbearia</TableHead>
                    <TableHead className="hidden lg:table-cell">Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Mensagens</TableHead>
                    <TableHead className="hidden lg:table-cell">Ultima Mensagem</TableHead>
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
                        <TableCell className="hidden text-sm md:table-cell">
                          {barbershop?.name ?? "Sem barbearia"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {barbershop?.subscription?.plan ?? "Sem plano"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ticket)}
                        </TableCell>
                        <TableCell className="hidden text-sm sm:table-cell">
                          {ticket._count.messages}
                        </TableCell>
                        <TableCell className="hidden max-w-48 text-xs text-muted-foreground lg:table-cell">
                          {preview}
                        </TableCell>
                        <TableCell>
                          {ticket.status === "IN_PROGRESS" ? (
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/dashboard/admin/support/${ticket.id}`}>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
