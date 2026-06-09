"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CreateClienteModal from "@/modules/clientes/components/CreateClienteModal";
import { useAuth } from "@/contexts/AuthContext";
import { canEliminarUsuario } from "@/lib/auth/permissions";
import { fetchUsuarios, mapUsuarioToClienteRow } from "@/lib/api/users";
import type { ClienteRow } from "@/types/user";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const { perfil } = useAuth();
  const [clients, setClients] = useState<ClienteRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<ClienteRow | null>(null);
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState<string[]>([]);
  
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);

  const [selectedStatus, setSelectedStatus] = useState("");
  // Pagination states
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);


  const router = useRouter();
    

  async function reloadClients(showSpinner = true, p = page, s = size, q = search) {
    if (showSpinner) setListLoading(true);
    setListError(null);
    try {
      const allUsers = await fetchUsuarios();
      let filtered = allUsers.filter(u => u.tipoUsuario === "CLIENTE");  
      if (q) {
          filtered = filtered.filter(
            u =>
              u.nombre.toLowerCase().includes(q.toLowerCase()) ||
              u.apellidos?.toLowerCase().includes(q.toLowerCase()) ||
              u.email?.toLowerCase().includes(q.toLowerCase())
          );
        }
      if (selectedProject) {
        filtered = filtered.filter(u => {
          const row = mapUsuarioToClienteRow(u);

          return row.project === selectedProject;
        });
      }
      if (selectedStatus) {
        filtered = filtered.filter(u => {
          const row = mapUsuarioToClienteRow(u);

          return row.status === selectedStatus;
        });
      }

      setTotalCount(filtered.length);
      setActiveCount(filtered.filter(u => u.activo).length);
      setInactiveCount(filtered.filter(u => !u.activo).length);

      const start = p * s;
      const paginated = filtered.slice(start, start + s);

      setClients(paginated.map(mapUsuarioToClienteRow));
      setTotalPages(Math.ceil(filtered.length / s) || 1);
      setTotalElements(filtered.length);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "No se pudieron cargar los clientes.");
    } finally {
      if (showSpinner) setListLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void reloadClients(true, page, size, search);
    });
  }, [
    page,
    size,
    search,
    selectedProject,
    selectedStatus
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSearch(searchInput);
  };


  return (
    <>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">Clientes y Asignaciones</h2>
          <p className="text-base text-slate-600 dark:text-white/70 mt-2">Registra clientes, gestiona sus datos y vincula unidades a su perfil.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/clientes/new"
            className="px-4 py-2 border border-build-accent rounded-xl text-build-main dark:text-white text-xs font-semibold hover:bg-build-bg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>Crear cliente
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p className="text-xs uppercase font-bold text-slate-500">
            Clientes Totales
          </p>
          <p className="text-3xl font-bold text-build-main dark:text-white mt-2">
            {totalCount}
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p className="text-xs uppercase font-bold text-slate-500">
            Clientes Activos
          </p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {activeCount}
          </p>
        </div>

        <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 p-5">
          <p className="text-xs uppercase font-bold text-slate-500">
            Clientes Inactivos
          </p>
          <p className="text-3xl font-bold text-slate-500 mt-2">
            {inactiveCount}
          </p>
        </div>
      </div>

      {listError && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-800 dark:text-red-400">
          {listError}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">

          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg"
            />

            <button
              type="submit"
              className="px-4 py-2 bg-build-main text-white rounded-lg font-semibold"
            >
              Buscar
            </button>
          </form>

          <select
            value={selectedProject}
            onChange={(e) => {
              setPage(0);
              setSelectedProject(e.target.value);
            }}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm"
          >
            <option value="">Todos los proyectos</option>

            {projects.map(project => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-white/5">
                {["Nombre", "Correo", "Teléfono", "Activo/Inactivo", "Acciones"].map(h => (
                  <th key={h} className="py-4 px-6 text-[12px] font-semibold text-slate-500 dark:text-white/60 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-build-main dark:text-white">
              {listLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-build-accent">
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Cargando clientes...
                    </span>
                  </td>
                </tr>
              )}
              {!listLoading && clients.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/clientes/${c.id}`)}
                className="border-b border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:bg-white/5 transition-colors cursor-pointer"
              >
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-full bg-build-bg flex items-center justify-center text-build-main dark:text-white text-xs font-bold">
                      {c.initials}
                    </div>
                    <div>
                      <span className="font-semibold text-build-main dark:text-white">
                        {c.name}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-6 text-build-accent">{c.email}</td>
                <td className="py-4 px-6 text-build-accent">{c.phone}</td>

                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${c.statusBg}`}
                  >
                    {c.status}
                  </span>
                </td>

                <td className="py-4 px-6 text-right">
                  <span className="text-xs text-slate-400">
                    Ver perfil →
                  </span>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || listLoading}
            className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-build-main dark:text-white hover:bg-slate-50 dark:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Anterior
          </button>
          <span className="text-sm font-medium text-slate-500 dark:text-white/60">
            Página {page + 1} de {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || listLoading}
            className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-build-main dark:text-white hover:bg-slate-50 dark:bg-white/5 disabled:opacity-50 transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>

      <CreateClienteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => reloadClients(false)}
      />



    </>
  );
}
