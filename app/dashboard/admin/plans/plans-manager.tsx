"use client";

import { useState } from "react";
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
import { Loader2, Save, Plus, X } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface PlanData {
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
  isActive: boolean;
}

interface PlansManagerProps {
  initialPlans: PlanData[];
}

export function PlansManager({ initialPlans }: PlansManagerProps) {
  const [plans, setPlans] = useState<PlanData[]>(initialPlans);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const { execute: save, isPending: isSaving } = useAction(updatePlan, {
    onSuccess: ({ data }) => {
      try {
        if (data) {
          setPlans((prev) =>
            prev.map((p) => (p.plan === data.plan ? { ...p, ...data } : p)),
          );
          toast.success("Plano atualizado com sucesso!");
          setEditingPlan(null);
        }
      } catch (e) {
        console.error("Error updating local state:", e);
        toast.success("Plano salvo! Recarregue a página para ver as alterações.");
        setEditingPlan(null);
      }
    },
    onError: ({ error }) => {
      console.error("Server action error:", error);
      toast.error(error.serverError ?? "Erro ao atualizar plano");
    },
  });

  const handleSave = (plan: PlanData) => {
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
      isActive: plan.isActive,
    });
  };

  const updatePlanField = (
    planKey: SubscriptionPlan,
    field: keyof PlanData,
    value: PlanData[keyof PlanData],
  ) => {
    setPlans((prev) =>
      prev.map((p) => (p.plan === planKey ? { ...p, [field]: value } : p)),
    );
  };

  const addFeature = (planKey: SubscriptionPlan) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.plan === planKey ? { ...p, features: [...p.features, ""] } : p,
      ),
    );
  };

  const updateFeature = (
    planKey: SubscriptionPlan,
    index: number,
    value: string,
  ) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.plan === planKey
          ? {
              ...p,
              features: p.features.map((f, i) => (i === index ? value : f)),
            }
          : p,
      ),
    );
  };

  const removeFeature = (planKey: SubscriptionPlan, index: number) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.plan === planKey
          ? { ...p, features: p.features.filter((_, i) => i !== index) }
          : p,
      ),
    );
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2).replace(".", ",");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => {
        const isEditing = editingPlan === plan.plan;
        return (
          <Card
            key={plan.plan}
            className={!plan.isActive ? "opacity-60" : undefined}
          >
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
                    onCheckedChange={(checked) => {
                      updatePlanField(plan.plan, "isActive", checked);
                      setEditingPlan(plan.plan);
                    }}
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
                  onChange={(e) => {
                    updatePlanField(plan.plan, "name", e.target.value);
                    setEditingPlan(plan.plan);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Descricao</Label>
                <Input
                  value={plan.description}
                  onChange={(e) => {
                    updatePlanField(plan.plan, "description", e.target.value);
                    setEditingPlan(plan.plan);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preco (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formatPrice(plan.priceInCents)}
                    onChange={(e) => {
                      const cents = Math.round(
                        parseFloat(e.target.value || "0") * 100,
                      );
                      updatePlanField(plan.plan, "priceInCents", cents);
                      setEditingPlan(plan.plan);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stripe Price ID</Label>
                  <Input
                    value={plan.stripePriceId}
                    onChange={(e) => {
                      updatePlanField(plan.plan, "stripePriceId", e.target.value);
                      setEditingPlan(plan.plan);
                    }}
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
                    onChange={(e) => {
                      updatePlanField(
                        plan.plan,
                        "maxBarbershops",
                        parseInt(e.target.value) || 1,
                      );
                      setEditingPlan(plan.plan);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Max Prof.</Label>
                  <Input
                    type="number"
                    min={1}
                    value={plan.maxProfessionals}
                    onChange={(e) => {
                      updatePlanField(
                        plan.plan,
                        "maxProfessionals",
                        parseInt(e.target.value) || 1,
                      );
                      setEditingPlan(plan.plan);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Max Serv.</Label>
                  <Input
                    type="number"
                    min={0}
                    value={plan.maxServices ?? ""}
                    placeholder="Ilimitado"
                    onChange={(e) => {
                      const value = e.target.value;
                      updatePlanField(
                        plan.plan,
                        "maxServices",
                        value === "" ? null : parseInt(value) || 1,
                      );
                      setEditingPlan(plan.plan);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addFeature(plan.plan)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="max-h-40 space-y-2 overflow-y-auto">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          updateFeature(plan.plan, index, e.target.value);
                          setEditingPlan(plan.plan);
                        }}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          removeFeature(plan.plan, index);
                          setEditingPlan(plan.plan);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {isEditing && (
                <Button
                  className="w-full"
                  onClick={() => handleSave(plan)}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Salvar Alteracoes
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
