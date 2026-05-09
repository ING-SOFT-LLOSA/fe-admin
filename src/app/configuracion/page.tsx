"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

type Permissions = {
  proyectos: boolean;
  clientes: boolean;
  finanzas: boolean;
  legal: boolean;
  agenda: boolean;
  configuracion: boolean;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  baseRole: string;
  status: "Activo" | "Inactivo";
  permissions: Permissions;
};

const DEFAULT_PERMISSIONS: Permissions = {
  proyectos: false,
  clientes: false,
  finanzas: false,
  legal: false,
  agenda: false,
  configuracion: false,
};

const INITIAL_USERS: UserData[] = [
  {
    id: "U001",
    name: "Administrador Global",
    email: "admin@llosaedificaciones.com",
    baseRole: "Superadmin",
    status: "Activo",
    permissions: { proyectos: true, clientes: true, finanzas: true, legal: true, agenda: true, configuracion: true },
  },
  {
    id: "U002",
    name: "Juan Pérez",
    email: "jperez@llosaedificaciones.com",
    baseRole: "Ventas",
    status: "Activo",
    permissions: { proyectos: false, clientes: true, finanzas: false, legal: false, agenda: true, configuracion: false },
  },
  {
    id: "U003",
    name: "Ana Gómez",
    email: "agomez@llosaedificaciones.com",
    baseRole: "Finanzas",
    status: "Activo",
    permissions: { proyectos: false, clientes: false, finanzas: true, legal: true, agenda: true, configuracion: false },
  },
];

const ROLES = ["Superadmin", "Ventas", "Finanzas", "Legal", "Operaciones", "Gerencia"];
const PERM_LABELS: Record<keyof Permissions, string> = {
  proyectos: "Gestión de Obra y Proyectos",
  clientes: "Comercial y Clientes",
  finanzas: "Pagos y Finanzas",
  legal: "Gestión Documental",
  agenda: "Calendario Corporativo",
  configuracion: "Ajustes del Sistema",
};

export default function UsersConfigurationPage() {
  const [users, setUsers] = useState<UserData[]>(INITIAL_USERS);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    baseRole: "Ventas",
  });
  const [perms, setPerms] = useState<Permissions>(DEFAULT_PERMISSIONS);

  // Flow states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Action targets
  const [targetUser, setTargetUser] = useState<UserData | null>(null);

  // Open Create Modal
  function handleOpenCreate() {
    setErrorMsg("");
    setSuccessMsg("");
    setEditingId(null);
    setFormData({ name: "", email: "", baseRole: "Ventas" });
    setPerms(DEFAULT_PERMISSIONS);
    setIsModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEdit(user: UserData) {
    if (user.status === "Inactivo") return;
    setErrorMsg("");
    setSuccessMsg("");
    setEditingId(user.id);
    setFormData({ name: user.name, email: user.email, baseRole: user.baseRole });
    setPerms({ ...user.permissions });
    setIsModalOpen(true);
  }

  // Handle Form Submit
  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Validate email domain
    if (!formData.email.endsWith("@llosaedificaciones.com")) {
      setErrorMsg("Error: Solo se permiten correos institucionales (@llosaedificaciones.com) para el personal de la empresa.");
      return;
    }

    setLoading(true);

    // Simulate backend call to Módulo-Seguridad & Firebase Auth
    setTimeout(() => {
      if (editingId) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingId
              ? { ...u, name: formData.name, email: formData.email, baseRole: formData.baseRole, permissions: perms }
              : u
          )
        );
        setSuccessMsg("Usuario editado y permisos sincronizados exitosamente.");
      } else {
        const newUser: UserData = {
          id: `U00${users.length + 1}`,
          name: formData.name,
          email: formData.email,
          baseRole: formData.baseRole,
          status: "Activo",
          permissions: perms,
        };
        setUsers([newUser, ...users]);
        setSuccessMsg("Usuario creado y permisos asignados exitosamente.");
      }

      setLoading(false);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 1500);
    }, 1200);
  }

  // Handle Role Change to auto-fill some permissions (mocking logic)
  function handleRoleChange(newRole: string) {
    setFormData({ ...formData, baseRole: newRole });
    if (newRole === "Superadmin") {
      setPerms({ proyectos: true, clientes: true, finanzas: true, legal: true, agenda: true, configuracion: true });
    } else if (newRole === "Ventas") {
      setPerms({ proyectos: false, clientes: true, finanzas: false, legal: false, agenda: true, configuracion: false });
    }
  }

  // Revoke confirm
  function confirmRevoke(user: UserData) {
    if (user.status === "Inactivo") return;
    setTargetUser(user);
    setIsConfirmOpen(true);
    setErrorMsg("");
  }

  function handleRevoke() {
    if (!targetUser) return;
    setLoading(true);

    // Simulated check (Unique responsible)
    if (targetUser.baseRole === "Superadmin" && users.filter((u) => u.baseRole === "Superadmin" && u.status === "Activo").length === 1) {
      setTimeout(() => {
        setLoading(false);
        setIsConfirmOpen(false);
        alert("Error de consistencia: No se puede desactivar al único Superadmin activo del sistema.");
      }, 800);
      return;
    }

    setTimeout(() => {
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? { ...u, status: "Inactivo" } : u)));
      setLoading(false);
      setIsConfirmOpen(false);
      setTargetUser(null);
    }, 1000);
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">Gestión de Usuarios</h1>
          <p className="text-base text-[#41484c] mt-2">Administración integral de cuentas del personal, roles base y permisos dinámicos.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all shadow-[0_4px_14px_rgba(2,49,67,0.25)] hover:shadow-[0_6px_20px_rgba(2,49,67,0.35)]"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Crear Nuevo Usuario
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-[#c1c7cc] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f9f9fb] border-b border-[#e2e2e4]">
              {["Usuario", "Correo", "Rol Base", "Estado", "Acciones"].map((h) => (
                <th key={h} className={`py-4 px-6 text-[12px] font-bold text-[#41484c] uppercase tracking-wider ${h === "Acciones" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e2e4]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-[#f9f9fb] transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e2e2e4] flex items-center justify-center text-[#1a1c1d] font-bold overflow-hidden">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${u.status === "Activo" ? "text-[#1a1c1d]" : "text-[#72787c] line-through"}`}>{u.name}</h3>
                      <p className="text-[11px] text-[#72787c] font-semibold">{u.id}</p>
                    </div>
                  </div>
                </td>
                <td className={`py-4 px-6 text-sm ${u.status === "Activo" ? "text-[#1a1c1d]" : "text-[#72787c]"}`}>{u.email}</td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#e2e2e4] text-[#41484c] text-[11px] font-bold">
                    {u.baseRole}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {u.status === "Activo" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#d6f0e0] text-[#1c663b] text-[10px] font-bold uppercase">
                      <div className="w-2 h-2 rounded-full bg-[#27a85e]" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#f2e6e6] text-[#ba1a1a] text-[10px] font-bold uppercase">
                      <div className="w-2 h-2 rounded-full bg-[#ba1a1a]" /> Inactivo
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className={`flex justify-end gap-2 transition-opacity ${u.status === "Inactivo" ? "opacity-50" : "opacity-0 group-hover:opacity-100"}`}>
                    <button
                      onClick={() => handleOpenEdit(u)}
                      disabled={u.status === "Inactivo"}
                      className="p-1.5 text-[#023143] bg-[#c2e8ff]/50 hover:bg-[#c2e8ff] rounded-md transition-all flex items-center justify-center"
                      title="Editar Perfil"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => confirmRevoke(u)}
                      disabled={u.status === "Inactivo"}
                      className="p-1.5 text-[#ba1a1a] bg-[#ffdad6]/50 hover:bg-[#ffdad6] rounded-md transition-all flex items-center justify-center"
                      title="Desactivar en Firebase/PostgreSQL"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_off</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creacion / Edicion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#e2e2e4] flex justify-between items-center bg-[#f9f9fb]">
              <h2 className="text-[20px] font-bold text-[#1a1c1d]">{editingId ? "Editar Usuario y Permisos" : "Crear Nuevo Usuario"}</h2>
              <button disabled={loading} onClick={() => setIsModalOpen(false)} className="text-[#72787c] hover:text-[#ba1a1a] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Form Info */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#41484c] mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#41484c] mb-1.5">Rol Base</label>
                  <select
                    value={formData.baseRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-bold text-[#41484c] mb-1.5">
                    Correo Corporativo <span className="text-[#c1c7cc] font-normal">(Firebase Auth)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]"
                    placeholder="correo@llosaedificaciones.com"
                  />
                </div>
              </div>

              {/* Dynamic Permissions */}
              <div>
                <h3 className="text-[14px] font-bold text-[#1a1c1d] mb-4 border-b border-[#e2e2e4] pb-2">
                  Permisos Dinámicos y Acceso a Módulos
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {(Object.keys(DEFAULT_PERMISSIONS) as Array<keyof Permissions>).map((key) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-[13px] font-medium text-[#41484c] group-hover:text-[#1a1c1d] transition-colors">
                        {PERM_LABELS[key]}
                      </span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={perms[key]}
                          onChange={(e) => setPerms({ ...perms, [key]: e.target.checked })}
                        />
                        <div className="w-9 h-5 bg-[#c1c7cc] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#023143]"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Messages */}
              {errorMsg && (
                <div className="p-3 rounded-lg bg-[#ffdad6]/50 border border-[#ba1a1a]/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[18px]">error</span>
                  <p className="text-[13px] font-bold text-[#ba1a1a]">{errorMsg}</p>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-lg bg-[#d6f0e0]/50 border border-[#1c663b]/20 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#1c663b] text-[18px]">check_circle</span>
                  <p className="text-[13px] font-bold text-[#1c663b]">{successMsg}</p>
                </div>
              )}
            </div>

            {/* Footer Form Actions */}
            <div className="px-6 py-4 border-t border-[#e2e2e4] bg-[#f9f9fb] flex justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-[#72787c] hover:text-[#1a1c1d] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !formData.name || !formData.email}
                className="px-5 py-2 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Confirmar Guardado
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[32px]">warning</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#1a1c1d] mb-2">¿Revocar Acceso?</h3>
            <p className="text-[13px] text-[#41484c] mb-6">
              Estás a punto de deshabilitar a <b>{targetUser.name}</b>. Esto lo marcará como inactivo en PostgreSQL y deshabilitará su
              identidad en Firebase perdiendo acceso al sistema al instante.
            </p>
            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 bg-[#e2e2e4] text-[#1a1c1d] rounded-lg text-sm font-bold hover:bg-[#c1c7cc] transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={loading}
                onClick={handleRevoke}
                className="flex-1 px-4 py-2.5 bg-[#ba1a1a] text-white rounded-lg text-sm font-bold hover:bg-[#93000a] transition-colors flex justify-center items-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  "Confirmar Revocación"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
