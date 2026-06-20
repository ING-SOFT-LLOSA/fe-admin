"use client";

import { useState } from "react";
import ClientSearchStep from "./steps/ClientSearchStep";
import ContractSelectionStep from "./steps/ContractSelectionStep";
import PaymentManagementStep from "./steps/PaymentManagementStep";
import type { Usuario } from "@/types/user";
import type { UsuarioActivoResponseDTO } from "@/lib/api/expedientes";

type Step = "search" | "contracts" | "management";

type FinancePaymentScheduleViewProps = {
  readonly initialProjectId?: string | null;
};

export default function FinancePaymentScheduleView({ initialProjectId: _initialProjectId }: Readonly<FinancePaymentScheduleViewProps>) {
  const [step, setStep] = useState<Step>("search");
  const [selectedClient, setSelectedClient] = useState<Usuario | null>(null);
  const [selectedExpediente, setSelectedExpediente] = useState<UsuarioActivoResponseDTO | null>(null);

  const handleSelectClient = (client: Usuario) => {
    setSelectedClient(client);
    setStep("contracts");
  };

  const handleSelectExpediente = (exp: UsuarioActivoResponseDTO) => {
    setSelectedExpediente(exp);
    setStep("management");
  };

  const handleBackToSearch = () => {
    setSelectedClient(null);
    setSelectedExpediente(null);
    setStep("search");
  };

  const handleBackToContracts = () => {
    setSelectedExpediente(null);
    setStep("contracts");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Título y Descripción */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">
          Pagos y Financiamiento
        </h2>
        <p className="mt-2 text-base text-slate-600 dark:text-white/70">
          Registro administrativo y control de cobranzas por cliente.
        </p>
      </div>

      {/* Breadcrumbs / Pasos Visuales */}
      <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
        {[
          { id: "search", label: "Buscar Cliente", active: step === "search", done: !!selectedClient },
          { id: "contracts", label: "Contratos", active: step === "contracts", done: !!selectedExpediente },
          { id: "management", label: "Gestión de Pagos", active: step === "management", done: false },
        ].map((s, i) => {
          const handleClick = () => {
            if (s.id === "search") return handleBackToSearch();
            if (s.id === "contracts") return handleBackToContracts();
            return null;
          };

          let buttonClass: string;
          if (s.active) {
            buttonClass = "bg-arch-gold text-white font-bold shadow-sm";
          } else if (s.done) {
            buttonClass = "text-build-main dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold";
          } else {
            buttonClass = "text-slate-400 dark:text-white/20 cursor-not-allowed font-medium";
          }

          let badgeClass: string;
          if (s.active) {
            badgeClass = "bg-white text-arch-gold";
          } else if (s.done) {
            badgeClass = "bg-arch-gold text-white";
          } else {
            badgeClass = "bg-slate-200 dark:bg-white/10 text-slate-500";
          }

          return (
          <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
            {i > 0 && (
              <span className="material-symbols-outlined text-slate-300 dark:text-white/10 text-[18px]">chevron_right</span>
            )}
            <button
              disabled={(s.id === "contracts" && !selectedClient) || (s.id === "management" && !selectedExpediente)}
              onClick={handleClick}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${buttonClass}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${badgeClass}`}>
                {s.done && !s.active ? "✓" : i + 1}
              </span>
              <span className="text-xs uppercase tracking-wider">{s.label}</span>
            </button>
          </div>
          );
        })}
      </nav>

      {/* Renderizado de Pasos */}
      <main className="min-h-[500px]">
        {step === "search" && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <ClientSearchStep onSelectClient={handleSelectClient} />
          </div>
        )}

        {step === "contracts" && selectedClient && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <ContractSelectionStep
              client={selectedClient}
              onSelectContract={handleSelectExpediente}
              onBack={handleBackToSearch}
            />
          </div>
        )}

        {step === "management" && selectedExpediente && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PaymentManagementStep
              expediente={selectedExpediente}
              onBack={handleBackToContracts}
            />
          </div>
        )}
      </main>
    </div>
  );
}
