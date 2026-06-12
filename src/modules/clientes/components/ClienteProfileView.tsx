"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchUsuarioPorId, mapUsuarioToClienteRow } from "@/lib/api/users";
import { fetchActivosPorUsuario, type ActivoUsuarioDTO } from "@/lib/api/expedientes";
import type { ClienteRow } from "@/types/user";

import AssignPropertyWizard from "@/modules/asignaciones/components/AssignPropertyWizard";
import EditClienteModal from "@/modules/clientes/components/EditClienteModal";
import DeleteUsuarioModal from "@/modules/clientes/components/DeleteUsuarioModal";
import ClientHeader from "./ClientHeader";
import ClientKpis from "./ClientKpis";
import ClientActivos from "./ClientActivos";
import ClientActivity from "./ClientActivity";

type Modal = "edit" | "delete" | "assign" | null;

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
  const [, setSelectedAssignment] = useState<any | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    Promise.all([
      fetchUsuarioPorId(Number(clientId)),
      fetchActivosPorUsuario(Number(clientId)),
    ])
      .then(([user, activosData]) => {
        if (!mounted) return;
        setClient(user ? mapUsuarioToClienteRow(user) : null);
        
        const mappedAssignments = (activosData || []).map((act: ActivoUsuarioDTO) => {
          const label = `${act.tipo === "ESTACIONAMIENTO" ? "Cochera" : act.tipo === "DEPOSITO" ? "Depósito" : "Dpto"} ${act.nro}`;
          
          return {
            clientId: Number(clientId),
            unitId: act.id,
            unitLabel: label,
            projectName: act.proyectoNombre || "Proyecto",
            financing: "Contrato",
            assignedAt: new Date().toISOString().split("T")[0],
            status: "Vigente",
            estadoTramiteLegal: act.estadoComercial,
            uuidUsuarioActivo: act.id,
          };
        });
        setAssignments(mappedAssignments);
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

  function refresh() {
    setRefreshCount((c) => c + 1);
  }

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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ClientHeader
            client={client}
            hasActiveProperties={activeAssignments.length > 0}
            onEdit={() => setActiveModal("edit")}
            onDelete={() => setActiveModal("delete")}
            onAssign={() => setActiveModal("assign")}
          />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <ClientKpis assignments={assignments} />
          <ClientActivos clientId={Number(clientId)} refreshKey={refreshCount} />
          <ClientActivity assignments={assignments} clientCreatedAt={client?.createdAt} />
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
    </div>
  );
}