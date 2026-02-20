import type { Metadata } from "next";
import ServixLanding from "@/components/ServixLanding";

export const metadata: Metadata = {
  title: "Servix — Gestão Profissional para Negócios de Beleza",
  description:
    "Automatize seus agendamentos, receba pelo cartão e envie confirmações pelo WhatsApp. Sua loja no ar em menos de 10 minutos.",
};

export default function LandingPage() {
  return <ServixLanding />;
}
