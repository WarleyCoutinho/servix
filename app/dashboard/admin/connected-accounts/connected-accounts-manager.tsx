"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { deleteConnectedAccount } from "@/actions/admin/delete-connected-account";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Link2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Loader2,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConnectedAccountData {
  id: string;
  email: string | null;
  businessName: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  type: string;
  created: number;
  professionalName: string | null;
  professionalId: string | null;
  barbershopName: string | null;
  requirements: {
    currentlyDue: string[];
    disabledReason: string | null;
  };
}

type FilterTab = "all" | "active" | "restricted";

interface ConnectedAccountsManagerProps {
  initialAccounts: ConnectedAccountData[];
}

export function ConnectedAccountsManager({
  initialAccounts,
}: ConnectedAccountsManagerProps) {
  const [accounts, setAccounts] =
    useState<ConnectedAccountData[]>(initialAccounts);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [accountToDelete, setAccountToDelete] =
    useState<ConnectedAccountData | null>(null);

  const { execute: executeDelete, isPending: isDeleting } = useAction(
    deleteConnectedAccount,
    {
      onSuccess: ({ data }) => {
        if (data) {
          setAccounts((prev) =>
            prev.filter((a) => a.id !== data.deletedId),
          );
          toast.success("Conta excluida com sucesso");
          setAccountToDelete(null);
        }
      },
      onError: ({ error }) => {
        const message = error.serverError || "Erro ao excluir conta";
        toast.error(message);
      },
    },
  );

  const activeCount = accounts.filter((a) => a.chargesEnabled).length;
  const restrictedCount = accounts.filter((a) => !a.chargesEnabled).length;

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      search === "" ||
      account.id.toLowerCase().includes(search.toLowerCase()) ||
      (account.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (account.businessName?.toLowerCase().includes(search.toLowerCase()) ??
        false) ||
      (account.professionalName
        ?.toLowerCase()
        .includes(search.toLowerCase()) ?? false) ||
      (account.barbershopName?.toLowerCase().includes(search.toLowerCase()) ??
        false);

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && account.chargesEnabled) ||
      (activeTab === "restricted" && !account.chargesEnabled);

    return matchesSearch && matchesTab;
  });

  const isTestMode = true;

  const getStripeDashboardUrl = (accountId: string) => {
    const mode = isTestMode ? "/test" : "";
    return `https://dashboard.stripe.com${mode}/connect/accounts/${accountId}`;
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "Tudo", count: accounts.length },
    { key: "restricted", label: "Restrita", count: restrictedCount },
    { key: "active", label: "Ativada", count: activeCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Link2 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-muted-foreground text-xs">Contas conectadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-muted-foreground text-xs">
              Recebendo pagamentos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restritas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restrictedCount}</div>
            <p className="text-muted-foreground text-xs">
              Pendente ou desabilitada
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className="flex flex-col items-center gap-0.5 px-4 py-3 h-auto"
          >
            <span className="text-lg font-bold leading-none">{tab.count}</span>
            <span className="text-xs font-normal">{tab.label}</span>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contas ({filteredAccounts.length})
            </CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-72 pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Conectada em</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-10 text-center"
                    >
                      {search
                        ? "Nenhuma conta encontrada para esta busca"
                        : "Nenhuma conta conectada"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {account.businessName ||
                              account.email ||
                              account.id}
                          </p>
                          <p className="text-muted-foreground font-mono text-xs">
                            {account.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.chargesEnabled ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Ativada
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Restrita</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{account.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {account.professionalName ? (
                          <div>
                            <p className="text-sm font-medium">
                              {account.professionalName}
                            </p>
                            {account.barbershopName && (
                              <p className="text-muted-foreground text-xs">
                                {account.barbershopName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(account.created * 1000),
                          "dd MMM yyyy",
                          { locale: ptBR },
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <a
                                href={getStripeDashboardUrl(account.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Ver no Stripe
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setAccountToDelete(account)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir conta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredAccounts.length > 0 && (
            <p className="text-muted-foreground mt-4 text-sm">
              Exibindo {filteredAccounts.length} de {accounts.length} contas
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={(open) => !open && setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta conectada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao e <strong>irreversivel</strong>. A conta sera
              permanentemente removida da plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {accountToDelete && (
            <div className="bg-muted rounded-md border p-3 font-mono text-sm">
              {accountToDelete.businessName ||
                accountToDelete.email ||
                accountToDelete.id}{" "}
              · {accountToDelete.id}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                if (accountToDelete) {
                  executeDelete({ accountId: accountToDelete.id });
                }
              }}
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
