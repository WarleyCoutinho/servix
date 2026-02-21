"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Loader2,
  Mail,
  Trash2,
  UserPlus,
  Users,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invite {
  id: string;
  email: string;
  accepted: boolean;
  createdAt: string | Date;
  admin: { name: string };
}

interface SupportUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string | Date;
}

export function SupportTeamManager({
  initialInvites,
  initialUsers,
}: {
  initialInvites: Invite[];
  initialUsers: SupportUser[];
}) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [users] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const platformUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(platformUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/support/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (data.alreadyRegistered) {
        setSuccess(data.message);
        router.refresh();
      } else {
        setInvites((prev) => [
          { ...data.invite, admin: { name: "Você" } },
          ...prev,
        ]);
        setSuccess(
          "Convite criado! Envie o link da plataforma para esta pessoa fazer login.",
        );
      }
      setEmail("");
    } catch {
      setError("Erro ao enviar convite.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (inviteId: string) => {
    setDeletingId(inviteId);
    try {
      const res = await fetch(
        `/api/admin/support/invite?id=${inviteId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        router.refresh();
      }
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const pendingInvites = invites.filter((i) => !i.accepted);
  const acceptedInvites = invites.filter((i) => i.accepted);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/admin/support">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Equipe de Suporte
          </h1>
          <p className="text-muted-foreground">
            Convide pessoas para ajudar no atendimento
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <div className="rounded-lg bg-green-500/10 p-2">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Convites Pendentes
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Convites Aceitos
            </CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedInvites.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Convidar Pessoa de Suporte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="Email Google da pessoa..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={sending || !email.trim()}>
              {sending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Mail className="mr-2 size-4" />
              )}
              Convidar
            </Button>
          </form>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {success && (
            <div className="space-y-2">
              <p className="text-sm text-green-500">{success}</p>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={platformUrl}
                  className="flex-1 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="mr-1 size-3" />
                  ) : (
                    <Copy className="mr-1 size-3" />
                  )}
                  {copied ? "Copiado!" : "Copiar link"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Envie este link para a pessoa. Ao fazer login com o Google,
                ela terá acesso automaticamente ao painel de suporte.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Membros da Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pessoa</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={user.image ?? ""} />
                          <AvatarFallback>
                            {user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {user.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              Convites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Convidado por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="text-sm font-medium">
                      {invite.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={invite.accepted ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {invite.accepted ? "Aceito" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invite.admin.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(invite.id)}
                        disabled={deletingId === invite.id}
                      >
                        {deletingId === invite.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
