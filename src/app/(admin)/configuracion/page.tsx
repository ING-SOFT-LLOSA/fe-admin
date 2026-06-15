"use client";

import React, { useEffect, useMemo, useState } from "react";

import PermissionGuard from "@/components/auth/PermissionGuard";
import { asignarRol, desactivarUsuario, fetchRoles, fetchUsuarios, registerEmpleado } from "@/lib/api/users";
import type { Rol, Usuario } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";

type TabKey = "usuarios" | "roles" | "permisos";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  ASESOR: "Asesor (Comercial)",
  LEGAL: "Legal",
  TECNICO: "Tecnico",
  POSTVENTA: "Postventa",
};



function fullName(user: Usuario) {
  return [user.nombre, user.apellidos].filter(Boolean).join(" ");
}

function permissionLabels(roles: Rol[]) {
  const entries = roles.flatMap((role) => role.funciones ?? []);
  return Array.from(new Map(entries.map((func) => [func.nombreCodigo, func.descripcion])).entries());
}

export default function EmployeeManagementPage() {
  const { perfil } = useAuth();
  const [users, setUsers] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("usuarios");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    rol: "ASESOR",
  });

  const employees = useMemo(() => users.filter((user) => user.tipoUsuario === "EMPLEADO"), [users]);
  const selectedUser = employees.find((user) => user.id === selectedUserId) ?? employees[0] ?? null;
  const selectedRole = roles.find((role) => role.nombre === selectedUser?.rol) ?? null;
  const allPermissions = useMemo(() => permissionLabels(roles), [roles]);
  const employeeRoles = useMemo(() => roles.filter((role) => role.nombre !== "CLIENTE"), [roles]);

  async function loadData() {
    setLoading(true);
    const [loadedUsers, loadedRoles] = await Promise.all([fetchUsuarios(), fetchRoles()]);
    const internalUsers = loadedUsers.filter((user) => user.tipoUsuario === "EMPLEADO");
    setUsers(loadedUsers);
    setRoles(loadedRoles);
    setSelectedUserId((current) => current ?? internalUsers[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadData().catch((err) => {
      setError(err instanceof Error ? err.message : "No se pudo cargar gestion de empleados.");
      setLoading(false);
    });
  }, []);

  function openCreateModal() {
    setError(null);
    setSuccess(null);
    setForm({ nombres: "", apellidos: "", email: "", rol: employeeRoles[0]?.nombre ?? "ASESOR" });
    setModalOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const role = roles.find((item) => item.nombre === form.rol);
      if (!role) throw new Error("Selecciona un rol base valido.");

      await registerEmpleado({
        nombre: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        tipoUsuario: "EMPLEADO",
        idRol: role.idRol,
      });
      await loadData();
      setSuccess("Usuario interno creado correctamente.");
      setTimeout(() => setModalOpen(false), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  async function changeRole(user: Usuario, roleName: string) {
    if (perfil && perfil.id === user.id) {
      setError("No puedes cambiar tu propio rol ni degradar tu cuenta administrativa.");
      return;
    }
    const role = roles.find((item) => item.nombre === roleName);
    if (!role) return;
    setError(null);
    setSaving(true);
    try {
      await asignarRol(user.id, role.idRol);
      await loadData();
      setSelectedUserId(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar el rol.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(user: Usuario) {
    if (!user.activo) return;
    if (perfil && perfil.id === user.id) {
      setError("No puedes desactivar tu propia cuenta.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await desactivarUsuario(user.id);
      await loadData();
      setSelectedUserId(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al desactivar el usuario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PermissionGuard requiredFuncs={["USER_GESTIONAR", "ROL_GESTIONAR"]} fallbackUrl="/proyectos">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main dark:text-white">Gestion de Empleados</h2>
            <p className="text-base text-slate-600 dark:text-white/70 mt-2">Administra usuarios internos, roles base, permisos y accesos.</p>
          </div>
          <button
            onClick={openCreateModal}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-build-main px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-build-main/90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Crear usuario
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10">
          {[
            ["usuarios", "Usuarios", "group"],
            ["roles", "Roles", "admin_panel_settings"],
            ["permisos", "Permisos", "lock"],
          ].map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabKey)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                activeTab === key
                  ? "border-build-main text-build-main dark:text-white"
                  : "border-transparent text-slate-500 hover:text-build-main dark:text-white/60"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:bg-white/5 dark:border-white/10">
            Cargando empleados...
          </div>
        ) : (
          <>
            {activeTab === "usuarios" && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:bg-white/5 dark:border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[12px] uppercase tracking-wider text-slate-500 dark:border-white/10">
                          <th className="px-5 py-4">Usuario</th>
                          <th className="px-5 py-4">Correo</th>
                          <th className="px-5 py-4">Rol base</th>
                          <th className="px-5 py-4">Estado</th>
                          <th className="px-5 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {employees.map((user) => (
                          <tr
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10 ${
                              selectedUser?.id === user.id ? "bg-build-bg/70 dark:bg-white/10" : ""
                            }`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-build-main text-xs font-bold text-white">
                                  {user.nombre.charAt(0)}{user.apellidos.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-build-main dark:text-white">{fullName(user)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-slate-600 dark:text-white/70">{user.email}</td>
                            <td className="px-5 py-4">
                              <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-build-main dark:bg-white/10 dark:text-white">
                                {ROLE_LABELS[String(user.rol)] ?? user.rol ?? "Sin rol"}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${user.activo ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#ffdad6] text-[#93000a]"}`}>
                                {user.activo ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deactivate(user);
                                }}
                                disabled={!user.activo || saving || perfil?.id === user.id}
                                className="rounded-md p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] disabled:opacity-40"
                                title={perfil && perfil.id === user.id ? "No puedes desactivar tu propio usuario" : "Desactivar usuario"}
                              >
                                <span className="material-symbols-outlined text-[18px]">person_off</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {selectedUser && (
                  <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-white/5 dark:border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Usuario</p>
                        <h3 className="mt-1 text-xl font-bold text-build-main dark:text-white">{fullName(selectedUser)}</h3>
                        <p className="text-sm text-slate-500">{selectedUser.email}</p>
                      </div>
                      <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${selectedUser.activo ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#ffdad6] text-[#93000a]"}`}>
                        {selectedUser.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="mt-5 space-y-5">
                      <section>
                        <h4 className="text-sm font-bold text-build-main dark:text-white">Informacion general</h4>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs font-bold uppercase text-slate-500">Nombres</dt>
                            <dd className="mt-1 text-build-main dark:text-white">{selectedUser.nombre}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-bold uppercase text-slate-500">Apellidos</dt>
                            <dd className="mt-1 text-build-main dark:text-white">{selectedUser.apellidos}</dd>
                          </div>
                        </dl>
                      </section>

                      <section>
                        <h4 className="text-sm font-bold text-build-main dark:text-white">Rol base</h4>
                        <select
                          value={String(selectedUser.rol ?? "")}
                          onChange={(event) => changeRole(selectedUser, event.target.value)}
                          disabled={!selectedUser.activo || saving || perfil?.id === selectedUser.id}
                          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-build-main focus:outline-none focus:border-build-accent dark:bg-white/5 dark:border-white/10 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {employeeRoles.map((role) => (
                            <option key={role.idRol} value={role.nombre}>{ROLE_LABELS[role.nombre] ?? role.nombre}</option>
                          ))}
                        </select>
                      </section>

                      <section>
                        <h4 className="text-sm font-bold text-build-main dark:text-white">Permisos personalizados</h4>
                        <div className="mt-3 grid gap-2">
                          {(selectedRole?.funciones ?? []).map((func) => (
                            <label key={func.nombreCodigo} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-white/10">
                              <span className="font-medium text-slate-600 dark:text-white/70">{func.descripcion}</span>
                              <input type="checkbox" checked readOnly className="h-4 w-4 accent-build-main" />
                            </label>
                          ))}
                        </div>
                      </section>


                    </div>
                  </aside>
                )}
              </div>
            )}

            {activeTab === "roles" && (
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles.map((role) => (
                  <article key={role.idRol} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-white/5 dark:border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-build-main dark:text-white">{ROLE_LABELS[role.nombre] ?? role.nombre}</h3>
                        <p className="mt-1 text-sm text-slate-500">{role.descripcion}</p>
                      </div>
                      <span className="material-symbols-outlined text-build-accent">admin_panel_settings</span>
                    </div>
                    <p className="mt-4 text-xs font-bold uppercase text-slate-500">Permisos del rol</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(role.funciones ?? []).map((func) => (
                        <span key={func.nombreCodigo} className="rounded bg-build-bg px-2 py-1 text-[11px] font-bold text-build-main">
                          {func.nombreCodigo}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {activeTab === "permisos" && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-white/5 dark:border-white/10">
                <h3 className="text-lg font-bold text-build-main dark:text-white">Permisos</h3>
                <p className="mt-1 text-sm text-slate-500">Catalogo de permisos que pueden asociarse a roles base o a usuarios especificos.</p>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {allPermissions.map(([code, description]) => (
                    <div key={code} className="rounded-lg border border-slate-200 px-4 py-3 dark:border-white/10">
                      <p className="text-sm font-bold text-build-main dark:text-white">{code}</p>
                      <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl dark:bg-[#111827]">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-white/10">
                <h3 className="text-xl font-bold text-build-main dark:text-white">Crear usuario</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-build-main">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 px-6 py-5">
                {success && <div className="rounded-lg bg-[#d6f0e0] px-4 py-3 text-sm font-bold text-[#1c663b]">{success}</div>}
                {error && <div className="rounded-lg bg-[#ffdad6] px-4 py-3 text-sm font-bold text-[#93000a]">{error}</div>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Nombres</label>
                    <input required value={form.nombres} onChange={(event) => setForm({ ...form, nombres: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-build-accent dark:bg-white/5 dark:border-white/10 dark:text-white" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Apellidos</label>
                    <input required value={form.apellidos} onChange={(event) => setForm({ ...form, apellidos: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-build-accent dark:bg-white/5 dark:border-white/10 dark:text-white" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Correo corporativo</label>
                  <input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-build-accent dark:bg-white/5 dark:border-white/10 dark:text-white" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">Rol base</label>
                  <select value={form.rol} onChange={(event) => setForm({ ...form, rol: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-build-accent dark:bg-white/5 dark:border-white/10 dark:text-white">
                    {employeeRoles.map((role) => (
                      <option key={role.idRol} value={role.nombre}>{ROLE_LABELS[role.nombre] ?? role.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
                  <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-build-main px-5 py-2.5 text-sm font-bold text-white hover:bg-build-main/90 disabled:opacity-60">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {saving ? "Guardando..." : "Crear usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
