"use client";

import { updatePlan } from "@/actions/admin/update-plan";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SubscriptionPlan } from "@/generated/prisma/enums";
import { Loader2, Plus, Save, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanData {
  id: string;
  plan: SubscriptionPlan;
  name: string;
  description: string;
  priceInCents: number;
  stripePriceId: string;
  maxBarbershops: number;
  maxProfessionals: number;
  maxServices: number | null;
  features: string[];
  idealFor: string[];
  isActive: boolean;
}

export interface PlansManagerProps {
  initialPlans: PlanData[];
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function centsToPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

function priceToCents(value: string): number {
  return Math.round(parseFloat(value || "0") * 100);
}

function updateListItem<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

function removeListItem<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StringListEditorProps {
  label: string;
  items: string[];
  onAdd: () => void;
  onUpdate: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

function StringListEditor({
  label,
  items,
  onAdd,
  onUpdate,
  onRemove,
}: StringListEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <Input
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="text-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: PlanData;
  isSaving: boolean;
  isDirty: boolean;
  onChange: (updated: PlanData) => void;
  onSave: (plan: PlanData) => void;
}

function PlanCard({
  plan,
  isSaving,
  isDirty,
  onChange,
  onSave,
}: PlanCardProps) {
  const patch = useCallback(
    <K extends keyof PlanData>(field: K, value: PlanData[K]) => {
      onChange({ ...plan, [field]: value });
    },
    [plan, onChange],
  );

  return (
    <Card className={!plan.isActive ? "opacity-60" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{plan.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor={`active-${plan.plan}`} className="text-xs">
              Ativo
            </Label>
            <Switch
              id={`active-${plan.plan}`}
              checked={plan.isActive}
              onCheckedChange={(checked) => patch("isActive", checked)}
            />
          </div>
        </div>
        <CardDescription>{plan.plan}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={plan.name}
            onChange={(e) => patch("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Input
            value={plan.description}
            onChange={(e) => patch("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preço (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={centsToPrice(plan.priceInCents)}
              onChange={(e) =>
                patch("priceInCents", priceToCents(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Stripe Price ID</Label>
            <Input
              value={plan.stripePriceId}
              onChange={(e) => patch("stripePriceId", e.target.value)}
              placeholder="price_xxx"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label className="text-xs">Max Lojas</Label>
            <Input
              type="number"
              min={1}
              value={plan.maxBarbershops}
              onChange={(e) =>
                patch("maxBarbershops", parseInt(e.target.value) || 1)
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Max Prof.</Label>
            <Input
              type="number"
              min={1}
              value={plan.maxProfessionals}
              onChange={(e) =>
                patch("maxProfessionals", parseInt(e.target.value) || 1)
              }
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Max Serv.</Label>
            <Input
              type="number"
              min={0}
              value={plan.maxServices ?? ""}
              placeholder="Ilimitado"
              onChange={(e) =>
                patch(
                  "maxServices",
                  e.target.value === "" ? null : parseInt(e.target.value) || 1,
                )
              }
            />
          </div>
        </div>

        <StringListEditor
          label="Features"
          items={plan.features}
          onAdd={() => patch("features", [...plan.features, ""])}
          onUpdate={(i, v) =>
            patch("features", updateListItem(plan.features, i, v))
          }
          onRemove={(i) => patch("features", removeListItem(plan.features, i))}
        />

        <StringListEditor
          label="Ideal para"
          items={plan.idealFor}
          onAdd={() => patch("idealFor", [...plan.idealFor, ""])}
          onUpdate={(i, v) =>
            patch("idealFor", updateListItem(plan.idealFor, i, v))
          }
          onRemove={(i) => patch("idealFor", removeListItem(plan.idealFor, i))}
        />

        {isDirty && (
          <Button
            className="w-full"
            onClick={() => onSave(plan)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlansManager({ initialPlans }: PlansManagerProps) {
  const [plans, setPlans] = useState<PlanData[]>(initialPlans);
  const [dirtyPlans, setDirtyPlans] = useState<Set<SubscriptionPlan>>(
    new Set(),
  );

  const markDirty = useCallback((planKey: SubscriptionPlan) => {
    setDirtyPlans((prev) => new Set(prev).add(planKey));
  }, []);

  const markClean = useCallback((planKey: SubscriptionPlan) => {
    setDirtyPlans((prev) => {
      const next = new Set(prev);
      next.delete(planKey);
      return next;
    });
  }, []);

  const { execute: save, isPending: isSaving } = useAction(updatePlan, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setPlans((prev) =>
        prev.map((p) => (p.plan === data.plan ? { ...p, ...data } : p)),
      );
      markClean(data.plan);
      toast.success("Plano atualizado com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar plano");
    },
  });

  const handleChange = useCallback(
    (updated: PlanData) => {
      setPlans((prev) =>
        prev.map((p) => (p.plan === updated.plan ? updated : p)),
      );
      markDirty(updated.plan);
    },
    [markDirty],
  );

  const handleSave = useCallback(
    (plan: PlanData) => {
      save({
        plan: plan.plan,
        name: plan.name,
        description: plan.description,
        priceInCents: plan.priceInCents,
        stripePriceId: plan.stripePriceId,
        maxBarbershops: plan.maxBarbershops,
        maxProfessionals: plan.maxProfessionals,
        maxServices: plan.maxServices,
        features: plan.features,
        idealFor: plan.idealFor,
        isActive: plan.isActive,
      });
    },
    [save],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard
          key={plan.plan}
          plan={plan}
          isSaving={isSaving && dirtyPlans.has(plan.plan)}
          isDirty={dirtyPlans.has(plan.plan)}
          onChange={handleChange}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}
