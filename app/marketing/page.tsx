import type { Metadata } from "next";
import ServixLanding from "@/components/ServixLanding";

export const metadata: Metadata = {
  title: "Servix — Gestão Profissional para Negócios de Beleza",
  description:
    "Automatize seus agendamentos, receba pelo cartão e envie confirmações pelo WhatsApp.",
};

export default function MarketingPage() {
  return <ServixLanding />;
}
