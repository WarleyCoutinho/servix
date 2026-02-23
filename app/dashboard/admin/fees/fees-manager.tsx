"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateBarbershopFee } from "@/actions/admin/update-barbershop-fee";
import { getFeeHistory } from "@/actions/admin/get-fee-history";
import { getEffectiveFee } from "@/lib/platform-fee";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Percent, History, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BarbershopData {
  id: string;
  name: string;
  createdAt: Date;
  platformFeePercentage: number | null;
  feeOverride: boolean;
  owner: { id: string; name: string; email: string } | null;
}

interface EditingFee {
  barbershopId: string;
  barbershopName: string;
  value: string;
  reason: string;
}

interface FeeHistoryEntry {
  id: string;
  fromFeePercentage: number | null;
  toFeePercentage: number | null;
  fromFeeOverride: boolean;
  toFeeOverride: boolean;
  reason: string | null;
  changedByName: string;
  changedAt: Date;
}

export function FeesManager({
  initialBarbershops,
}: {
  initialBarbershops: BarbershopData[];
}) {
  const [barbershops, setBarbershops] =
    useState<BarbershopData[]>(initialBarbershops);
  const [search, setSearch] = useState("");
  const [editingFee, setEditingFee] = useState<EditingFee | null>(null);
  const [historyData, setHistoryData] = useState<FeeHistoryEntry[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const { execute: executeUpdateFee, isExecuting: isUpdating } = useAction(
    updateBarbershopFee,
    {
      onSuccess: ({ data }) => {
        if (data && editingFee) {
          setBarbershops((prev) =>
            prev.map((b) =>
              b.id === editingFee.barbershopId
                ? {
                    ...b,
                    platformFeePercentage: data.platformFeePercentage,
                    feeOverride: data.feeOverride,
                  }
                : b,
            ),
          );
          toast.success(`Taxa de ${data.name} atualizada com sucesso`);
          setIsEditDialogOpen(false);
          setEditingFee(null);
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao atualizar taxa");
      },
    },
  );

  const { execute: executeGetHistory, isExecuting: isLoadingHistory } =
    useAction(getFeeHistory, {
      onSuccess: ({ data }) => {
        if (data) {
          setHistoryData(data);
        }
      },
      onError: ({ error }) => {
        toast.error(
          error.serverError ?? "Erro ao carregar histórico",
        );
      },
    });

  const filteredBarbershops = barbershops.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.owner?.name.toLowerCase().includes(q) ||
      b.owner?.email.toLowerCase().includes(q)
    );
  });

  function handleOpenEdit(barbershop: BarbershopData) {
    const fee = getEffectiveFee(barbershop);
    setEditingFee({
      barbershopId: barbershop.id,
      barbershopName: barbershop.name,
      value: fee.feePercentage.toString(),
      reason: "",
    });
    setIsEditDialogOpen(true);
  }

  function handleOpenHistory(barbershopId: string) {
    setHistoryData([]);
    setIsHistoryDialogOpen(true);
    executeGetHistory({ barbershopId });
  }

  function handleSaveFee() {
    if (!editingFee) return;

    const val = editingFee.value.trim();
    const num = parseInt(val, 10);

    if (isNaN(num) || num < 0 || num > 10) {
      toast.error("Taxa deve ser um número inteiro entre 0 e 10");
      return;
    }

    executeUpdateFee({
      barbershopId: editingFee.barbershopId,
      platformFeePercentage: num,
      reason: editingFee.reason || undefined,
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Barbearias ({filteredBarbershops.length})</CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
              <Input
                placeholder="Buscar barbearia ou proprietário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbearia</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Taxa Efetiva</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBarbershops.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhuma barbearia encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBarbershops.map((barbershop) => {
                    const fee = getEffectiveFee(barbershop);

                    return (
                      <TableRow key={barbershop.id}>
                        <TableCell className="font-medium">
                          {barbershop.name}
                        </TableCell>
                        <TableCell>
                          {barbershop.owner ? (
                            <div>
                              <p className="text-sm">{barbershop.owner.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {barbershop.owner.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {fee.status === "grace_period" && (
                            <Badge variant="outline">
                              Primeiros 90 dias ({fee.daysRemaining}d restantes)
                            </Badge>
                          )}
                          {fee.status === "progressive" && (
                            <Badge variant="secondary">
                              Progressiva ({fee.feePercentage}%)
                            </Badge>
                          )}
                          {fee.status === "default" && (
                            <Badge variant="secondary">Taxa máxima</Badge>
                          )}
                          {fee.status === "manual_override" && (
                            <Badge>Override manual</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Percent className="text-muted-foreground size-3.5" />
                            <span className="font-mono font-semibold">
                              {fee.feePercentage}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(barbershop.createdAt),
                            "dd/MM/yyyy",
                            { locale: ptBR },
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(barbershop)}
                            >
                              Editar Taxa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleOpenHistory(barbershop.id)
                              }
                            >
                              <History className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar Taxa — {editingFee?.barbershopName}
            </DialogTitle>
            <DialogDescription>
              Defina uma taxa manual entre 0% e 10%.
            </DialogDescription>
          </DialogHeader>
          {editingFee && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Taxa (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={editingFee.value}
                  onChange={(e) =>
                    setEditingFee({ ...editingFee, value: e.target.value })
                  }
                  placeholder="0-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Motivo (opcional)
                </label>
                <Textarea
                  value={editingFee.reason}
                  onChange={(e) =>
                    setEditingFee({ ...editingFee, reason: e.target.value })
                  }
                  placeholder="Ex: Negociação comercial"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingFee(null);
              }}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveFee} disabled={isUpdating}>
              {isUpdating && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Todas as alterações de taxa registradas
            </DialogDescription>
          </DialogHeader>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : historyData.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              Nenhuma alteração registrada
            </div>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {historyData.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-1 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {format(
                          new Date(entry.changedAt),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR },
                        )}
                      </span>
                      <span className="text-muted-foreground">por</span>
                      <span>{entry.changedByName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-muted-foreground">
                        {entry.fromFeePercentage ?? "auto"}%
                      </span>
                      <span>→</span>
                      <span>
                        {entry.toFeePercentage ?? "auto"}%
                      </span>
                    </div>
                  </div>
                  {entry.reason && (
                    <p className="text-muted-foreground text-sm">
                      {entry.reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
