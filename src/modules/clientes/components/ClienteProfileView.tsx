"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchUsuarioPorId, mapUsuarioToClienteRow } from "@/lib/api/users";
import { fetchExpedientesPorUsuario, type UsuarioActivoResponseDTO } from "@/lib/api/expedientes";
import type { ClienteRow, ClienteAssignment } from "@/types/user";

import AssignPropertyWizard from "@/modules/asignaciones/components/AssignPropertyWizard";
import EditClienteModal from "@/modules/clientes/components/EditClienteModal";
import DeleteUsuarioModal from "@/modules/clientes/components/DeleteUsuarioModal";
import ReactivarUsuarioModal from "@/modules/clientes/components/ReactivarUsuarioModal";
import ClientHeader from "./ClientHeader";
import ClientActivos from "./ClientActivos";
import ClientActivity from "./ClientActivity";

type Modal = "edit" | "delete" | "reactivate" | "assign" | null;

type ClienteProfileViewProps = {
  readonly clientId: string;
};

/** Mapea los contratos del cliente a la timeline de asignaciones. */
function buildAssignments(
  contratos: readonly UsuarioActivoResponseDTO[],
  clientId: string,
): ClienteAssignment[] {
  return contratos.flatMap((c) =>
    (c.activos ?? []).map((a) => ({
      clientId: Number(clientId),
      unitId: a.id,
      unitLabel: a.nro,
      projectName: a.proyectoNombre ?? "Proyecto",
      financing: c.tipoFinanciamiento ?? "Contrato",
      assignedAt: c.fechaAdquisicion
        ? c.fechaAdquisicion.split("T")[0]
        : new Date().toISOString().split("T")[0],
      status: c.vigente === false ? "Inactivo" : "Vigente",
      estadoTramiteLegal: c.estadoTramiteLegal ?? "",
      uuidUsuarioActivo: c.uuidUsuarioActivo,
    })),
  );
}

export default function ClienteProfileView({ clientId }: Readonly<ClienteProfileViewProps>) {
  const router = useRouter();

  const [client, setClient] = useState<ClienteRow | null>(null);
  const [assignments, setAssignments] = useState<ClienteAssignment[]>([]);
  const [totalContratos, setTotalContratos] = useState(0);
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const [user, contratos] = await Promise.all([
          fetchUsuarioPorId(Number(clientId)),
          fetchExpedientesPorUsuario(Number(clientId)).then((c) => c ?? []).catch(() => []),
        ]);
        if (!mounted) return;

        setClient(user ? mapUsuarioToClienteRow(user) : null);

        // Stats para el header
        setTotalContratos(contratos.length);
        const unidades = contratos.reduce(
          (sum, c) => sum + (c.activos?.length ?? 0),
          0
        );
        setTotalUnidades(unidades);

        // Timeline de actividad (basada en contratos)
        setAssignments(buildAssignments(contratos, clientId));
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "No se pudo cargar el cliente.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();
    return () => { mounted = false; };
  }, [clientId, refreshCount]);

  const activeAssignments = assignments.filter((a) => a.status === "Vigente");

  function closeModal() { setActiveModal(null); }
  function refresh() { setRefreshCount((c) => c + 1); }

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
          className="inline-flex items-center gap-1 text-sm font-semibold text-arch-gold hover:text-build-main dark:hover:text-white mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Volver a Clientes</span>
        </Link>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-build-main dark:text-white">
          Perfil del cliente
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
          {client.name}
        </p>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ClientHeader
            client={client}
            hasActiveProperties={activeAssignments.length > 0}
            totalContratos={totalContratos}
            totalUnidades={totalUnidades}
            onEdit={() => setActiveModal("edit")}
            onDelete={() => setActiveModal("delete")}
            onReactivate={() => setActiveModal("reactivate")}
            onAssign={() => setActiveModal("assign")}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-5">
          <ClientActivos
            clientId={Number(clientId)}
            refreshKey={refreshCount}
            onUnlinked={refresh}
          />
          <ClientActivity
            assignments={assignments}
            clientCreatedAt={client?.createdAt}
          />
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

      <ReactivarUsuarioModal
        open={activeModal === "reactivate"}
        usuario={client}
        onClose={closeModal}
        onReactivated={() => { closeModal(); refresh(); }}
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
