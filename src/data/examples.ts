import { ProcessDefinition } from "@/lib/types";
import { ARW_COMERCIAL_GRAPH } from "./graphs/arw-comercial";
import { MATURI_COMERCIAL_GRAPH } from "./graphs/maturi-comercial";

export const EXAMPLE_PROCESSES: ProcessDefinition[] = [
  {
    id: "arw-comercial",
    client: "arw",
    process: "comercial",
    title: "Processo Comercial",
    description:
      "Fluxo completo de vendas: captação → qualificação → negociação → fechamento → onboarding (BPMN 2.0)",
    updatedAt: "2025-01-15",
    graph: ARW_COMERCIAL_GRAPH,
  },
  {
    id: "maturi-comercial",
    client: "maturi",
    process: "comercial",
    title: "Maturi — Comercial + Onboarding",
    description:
      "Dois pools no mesmo diagrama: comercial (captação → SDR → Closer → proposta → C4) conectado ao onboarding (form → contrato → Autentique → ativação). Stack: ClickUp · n8n · Zappfy · Brevo · Google · Autentique · GPT.",
    updatedAt: "2026-04-07",
    graph: MATURI_COMERCIAL_GRAPH,
  },
];

export function getProcess(
  client: string,
  process: string,
): ProcessDefinition | undefined {
  return EXAMPLE_PROCESSES.find(
    (p) =>
      p.client.toLowerCase() === client.toLowerCase() &&
      p.process.toLowerCase() === process.toLowerCase(),
  );
}

export function getClientProcesses(client: string): ProcessDefinition[] {
  return EXAMPLE_PROCESSES.filter(
    (p) => p.client.toLowerCase() === client.toLowerCase(),
  );
}
