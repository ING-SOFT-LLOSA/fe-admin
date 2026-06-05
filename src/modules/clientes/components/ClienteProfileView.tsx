"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import type { ClienteRow } from "@/types/user";

import AssignPropertyWizard from "@/modules/asignaciones/components/AssignPropertyWizard";
import EditClienteModal from "@/modules/clientes/components/EditClienteModal";
import DeleteUsuarioModal from "@/modules/clientes/components/DeleteUsuarioModal";
import UnlinkPropertyModal from "@/modules/clientes/components/UnlinkPropertyModal";

import ClientHeader from "./ClientHeader";
import ClientKpis from "./ClientKpis";
import ClientGeneralStatus from "./ClientGeneralStatus";
import ClientProperties from "./ClientProperties";
import ClientActivity from "./ClientActivity";
import ClientExpedients from "./ClientExpedients";

type Modal = "edit" | "delete" | "assign" | "unlink" | null;

type ClienteProfileViewProps = {
  clientId: string;
};

export default function ClienteProfileView({ clientId }: ClienteProfileViewProps) {
  const router = useRouter();

  const [client, setClient] = useState<ClienteRow | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      fetchUsuarios(),
      import("@/lib/api/users").then(m => m.fetchExpedientesPorUsuario(Number(clientId)))
    ])
      .then(([users, exps]) => {
        if (!mounted) return;
        const found = users.find((user) => String(user.id) === clientId);
        setClient(found ? mapUsuarioToClienteRow(found) : null);
        setAssignments(exps);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "No se pudo cargar el cliente.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [clientId, refreshCount]);

  const activeAssignments = assignments.filter((a) => a.status === "Vigente");

  function closeModal() {
    setActiveModal(null);
    setSelectedAssignment(null);
  }

  function handleUnlink(assignment: any) {
    setSelectedAssignment(assignment);
    setActiveModal("unlink");
  }

  function refresh() {
    setRefreshCount((c) => c + 1);
  }

  // --- States ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-slate-500">
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm font-medium">Cargando perfil del cliente...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-8 text-sm text-red-800 dark:text-red-400">
        {error ?? "Cliente no encontrado."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-sm font-semibold text-build-accent hover:text-build-main dark:hover:text-white mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Volver a Clientes
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold text-build-main dark:text-white">
          Perfil del Cliente
        </h2>
        <p className="text-base text-slate-600 dark:text-white/70 mt-1">
          Visión general de {client.name}
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ClientHeader
            client={client}
            hasActiveProperties={activeAssignments.length > 0}
            onEdit={() => setActiveModal("edit")}
            onDelete={() => setActiveModal("delete")}
            onAssign={() => setActiveModal("assign")}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <ClientKpis assignments={assignments} />
          <ClientGeneralStatus assignments={assignments} />
          <ClientProperties assignments={assignments} onUnlink={handleUnlink} />
          <ClientActivity assignments={assignments} clientCreatedAt="2026-01-15" />
          <ClientExpedients assignments={assignments} />
        </div>
      </div>

      {/* Modals */}
      <EditClienteModal
        open={activeModal === "edit"}
        cliente={client}
        onClose={closeModal}
        onUpdated={() => { closeModal(); refresh(); }}
      />

      <DeleteUsuarioModal
        open={activeModal === "delete"}
        usuario={client}
        onClose={closeModal}
        onDeleted={() => router.push("/clientes")}
      />

      {activeModal === "assign" && (
        <AssignPropertyWizard
          client={client}
          onClose={closeModal}
          onSuccess={() => { closeModal(); refresh(); }}
        />
      )}

      <UnlinkPropertyModal
        open={activeModal === "unlink"}
        assignment={selectedAssignment}
        onClose={closeModal}
        onUnlinked={() => { closeModal(); refresh(); }}
      />
    </div>
  );
}