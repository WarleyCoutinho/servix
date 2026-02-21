"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateBarbershopFee } from "@/actions/admin/update-barbershop-fee";
import { updateUserRole } from "@/actions/admin/update-user-role";
import { toggleUserBan } from "@/actions/admin/toggle-user-ban";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserRole } from "@/generated/prisma/enums";
import {
  Users,
  Shield,
  Store,
  Scissors,
  User,
  Ban,
  Search,
  Loader2,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  banned: boolean;
  banReason: string | null;
  createdAt: Date;
  ownedBarbershops: { id: string; name: string; platformFeePercentage: number | null }[];
  professional: { id: string; barbershopId: string; isActive: boolean } | null;
}

interface UsersManagerProps {
  initialUsers: UserData[];
  stats: {
    total: number;
    admins: number;
    owners: number;
    professionals: number;
    clients: number;
    banned: number;
  };
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.admin]: "Administrador",
  [UserRole.support]: "Suporte",
  [UserRole.owner]: "Proprietário",
  [UserRole.professional]: "Profissional",
  [UserRole.client]: "Cliente",
};

const roleColors: Record<UserRole, string> = {
  [UserRole.admin]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [UserRole.support]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  [UserRole.owner]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  [UserRole.professional]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [UserRole.client]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function UsersManager({ initialUsers, stats }: UsersManagerProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [banReason, setBanReason] = useState("");
  const [editingFee, setEditingFee] = useState<{ barbershopId: string; value: string } | null>(null);

  const { execute: executeUpdateRole, isPending: isUpdatingRole } = useAction(
    updateUserRole,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setUsers((prev) =>
            prev.map((u) => (u.id === data.id ? { ...u, role: data.role } : u)),
          );
          toast.success("Role atualizado com sucesso!");
        }
      },
      onError: ({ error }) => {
        const message =
          error.validationErrors?.role?._errors?.[0] ||
          error.validationErrors?.userId?._errors?.[0] ||
          error.serverError ||
          "Erro ao atualizar role";
        toast.error(message);
      },
    },
  );

  const { execute: executeUpdateFee, isPending: isUpdatingFee } = useAction(
    updateBarbershopFee,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              ownedBarbershops: u.ownedBarbershops.map((b) =>
                b.id === data.id
                  ? { ...b, platformFeePercentage: data.platformFeePercentage }
                  : b,
              ),
            })),
          );
          toast.success(`Taxa de ${data.name} atualizada!`);
          setEditingFee(null);
        }
      },
      onError: ({ error }) => {
        const message =
          error.validationErrors?.barbershopId?._errors?.[0] ||
          error.validationErrors?.platformFeePercentage?._errors?.[0] ||
          error.serverError ||
          "Erro ao atualizar taxa";
        toast.error(message);
      },
    },
  );

  const { execute: executeToggleBan, isPending: isTogglingBan } = useAction(
    toggleUserBan,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === data.id
                ? { ...u, banned: data.banned, banReason: data.banReason }
                : u,
            ),
          );
          toast.success(
            data.banned ? "Usuário banido com sucesso!" : "Usuário desbanido com sucesso!",
          );
          setBanReason("");
        }
      },
      onError: ({ error }) => {
        const message =
          error.validationErrors?.userId?._errors?.[0] ||
          error.serverError ||
          "Erro ao alterar status de ban";
        toast.error(message);
      },
    },
  );

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const isLoading = isUpdatingRole || isTogglingBan || isUpdatingFee;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owners</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.owners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
            <Scissors className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.professionals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <User className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banidos</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.banned}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
                <Input
                  placeholder="Buscar usuário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar por role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.owner}>Owner</SelectItem>
                  <SelectItem value={UserRole.professional}>
                    Profissional
                  </SelectItem>
                  <SelectItem value={UserRole.client}>Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback>
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: string) =>
                          executeUpdateRole({
                            userId: user.id,
                            role: value as UserRole,
                          })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-44">
                          <Badge className={roleColors[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UserRole.admin}>
                            Administrador
                          </SelectItem>
                          <SelectItem value={UserRole.support}>
                            Suporte
                          </SelectItem>
                          <SelectItem value={UserRole.owner}>
                            Proprietário
                          </SelectItem>
                          <SelectItem value={UserRole.professional}>
                            Profissional
                          </SelectItem>
                          <SelectItem value={UserRole.client}>
                            Cliente
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.ownedBarbershops.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {editingFee?.barbershopId === user.ownedBarbershops[0].id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={editingFee.value}
                                onChange={(e) =>
                                  setEditingFee({ ...editingFee, value: e.target.value })
                                }
                                className="w-20"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const val = editingFee.value.trim();
                                    executeUpdateFee({
                                      barbershopId: editingFee.barbershopId,
                                      platformFeePercentage: val === "" ? null : parseInt(val, 10),
                                    });
                                  }
                                  if (e.key === "Escape") setEditingFee(null);
                                }}
                                disabled={isUpdatingFee}
                                autoFocus
                              />
                              <span className="text-muted-foreground text-xs">%</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                disabled={isUpdatingFee}
                                onClick={() => {
                                  const val = editingFee.value.trim();
                                  executeUpdateFee({
                                    barbershopId: editingFee.barbershopId,
                                    platformFeePercentage: val === "" ? null : parseInt(val, 10),
                                  });
                                }}
                              >
                                {isUpdatingFee ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "OK"
                                )}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() =>
                                setEditingFee({
                                  barbershopId: user.ownedBarbershops[0].id,
                                  value:
                                    user.ownedBarbershops[0].platformFeePercentage?.toString() ?? "",
                                })
                              }
                              disabled={isLoading}
                            >
                              <Percent className="h-3 w-3" />
                              {user.ownedBarbershops[0].platformFeePercentage != null
                                ? `${user.ownedBarbershops[0].platformFeePercentage}%`
                                : "Padrão"}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Banido
                        </Badge>
                      ) : (
                        <Badge variant="outline">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant={user.banned ? "outline" : "destructive"}
                            size="sm"
                            disabled={isLoading}
                          >
                            {isTogglingBan && (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            )}
                            {user.banned ? "Desbanir" : "Banir"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.banned
                                ? "Desbanir usuário?"
                                : "Banir usuário?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {user.banned ? (
                                <>
                                  O usuário <strong>{user.name}</strong> poderá
                                  acessar o sistema novamente.
                                  {user.banReason && (
                                    <span className="mt-2 block">
                                      Motivo do ban: {user.banReason}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  O usuário <strong>{user.name}</strong> não
                                  poderá mais acessar o sistema.
                                  <Input
                                    className="mt-4"
                                    placeholder="Motivo do ban (opcional)"
                                    value={banReason}
                                    onChange={(e) =>
                                      setBanReason(e.target.value)
                                    }
                                  />
                                </>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                executeToggleBan({
                                  userId: user.id,
                                  banned: !user.banned,
                                  banReason: user.banned ? undefined : banReason,
                                })
                              }
                              className={
                                user.banned
                                  ? ""
                                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              }
                            >
                              {user.banned ? "Desbanir" : "Banir"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
