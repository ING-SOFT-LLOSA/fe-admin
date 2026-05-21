"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { fetchUsuarios, registerEmpleado, asignarRol, desactivarUsuario, fetchRoles } from "@/lib/api/users";
import type { Usuario, Rol } from "@/types/user";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador Global",
  ASESOR: "Asesor de Ventas",
  LEGAL: "Legal",
  TECNICO: "Técnico",
  POSTVENTA: "Postventa"
};

const PERM_LABELS: Record<string, string> = {
  PROY_VER: "Ver Proyectos",
  PROY_CREAR: "Crear Proyectos",
  PROY_EDITAR: "Editar Proyectos",
  USER_GESTIONAR: "Gestión de Empleados",
  ROL_GESTIONAR: "Gestión de Roles",
  DOCS_VER: "Ver Documentos",
  DOCS_SUBIR: "Subir Documentos",
  PAGOS_VER: "Ver Pagos",
  CONTRATO_VER: "Ver Contratos",
  CONTRATO_EDITAR: "Editar Contratos",
  OBRA_VER: "Ver Avance Obra",
  OBRA_EDITAR: "Editar Avance Obra",
};

export default function UsersConfigurationPage() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [rolesList, setRolesList] = useState<Rol[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    baseRole: "",
  });
  
  // Array de codigos de funciones activas en base al rol seleccionado
  const [selectedRoleFuncs, setSelectedRoleFuncs] = useState<string[]>([]);

  // Flow states
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Action targets
  const [targetUser, setTargetUser] = useState<Usuario | null>(null);

  async function loadData() {
    try {
      const [allUsers, allRoles] = await Promise.all([
        fetchUsuarios(),
        fetchRoles()
      ]);
      setUsers(allUsers.filter(u => u.tipoUsuario === "EMPLEADO"));
      setRolesList(allRoles.filter(r => r.nombre !== "CLIENTE"));
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleOpenCreate() {
    setErrorMsg("");
    setSuccessMsg("");
    setEditingId(null);
    const defaultRole = rolesList.length > 0 ? rolesList[0].nombre : "";
    setFormData({ name: "", email: "", baseRole: defaultRole });
    updateCheckboxes(defaultRole);
    setIsModalOpen(true);
  }

  function handleOpenEdit(user: Usuario) {
    if (!user.activo) return;
    setErrorMsg("");
    setSuccessMsg("");
    setEditingId(user.id);
    const name = [user.nombre, user.apellidos].filter(Boolean).join(" ");
    const roleName = user.rol || (rolesList[0]?.nombre || "");
    setFormData({ name, email: user.email, baseRole: roleName });
    updateCheckboxes(roleName);
    setIsModalOpen(true);
  }

  function updateCheckboxes(roleName: string) {
    const rol = rolesList.find(r => r.nombre === roleName);
    if (rol && rol.funciones) {
      setSelectedRoleFuncs(rol.funciones.map(f => f.nombreCodigo));
    } else {
      setSelectedRoleFuncs([]);
    }
  }

  function handleRoleChange(newRole: string) {
    setFormData({ ...formData, baseRole: newRole });
    updateCheckboxes(newRole);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const rol = rolesList.find(r => r.nombre === formData.baseRole);
      if (!rol) throw new Error("Debes seleccionar un rol válido.");

      if (editingId) {
        // En edición, el backend solo soporta actualizar el rol
        await asignarRol(editingId, rol.idRol);
        setSuccessMsg("Rol del usuario actualizado exitosamente.");
      } else {
        // Creación
        const parts = formData.name.trim().split(" ");
        const nombre = parts[0] || "Usuario";
        const apellidos = parts.slice(1).join(" ") || "-";

        await registerEmpleado({
          nombre,
          apellidos,
          email: formData.email,
          tipoUsuario: "EMPLEADO",
          idRol: rol.idRol
        });
        setSuccessMsg("Usuario creado. Se ha enviado un correo para establecer la contraseña.");
      }

      await loadData();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  function confirmRevoke(user: Usuario) {
    if (!user.activo) return;
    setTargetUser(user);
    setIsConfirmOpen(true);
    setErrorMsg("");
  }

  async function handleRevoke() {
    if (!targetUser) return;
    setLoading(true);

    try {
      if (targetUser.rol === "ADMIN" && users.filter(u => u.rol === "ADMIN" && u.activo).length <= 1) {
        throw new Error("No puedes desactivar al único administrador activo.");
      }

      await desactivarUsuario(targetUser.id);
      await loadData();
      setIsConfirmOpen(false);
      setTargetUser(null);
    } catch (err: any) {
      alert(err.message || "Error al desactivar el usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">Gestión de Empleados</h1>
          <p className="text-base text-[#41484c] mt-2">Administra usuarios internos, roles y permisos de acceso.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          disabled={initialLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all shadow-[0_4px_14px_rgba(2,49,67,0.25)] hover:shadow-[0_6px_20px_rgba(2,49,67,0.35)] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Crear usuario interno
        </button>
      </div>

      {initialLoading ? (
        <div className="flex justify-center items-center py-20">
           <svg className="animate-spin w-8 h-8 text-[#023143]" viewBox="0 0 24 24" fill="none">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
           </svg>
        </div>
      ) : (
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
                        {u.nombre.charAt(0)}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold ${u.activo ? "text-[#1a1c1d]" : "text-[#72787c] line-through"}`}>
                          {[u.nombre, u.apellidos].filter(Boolean).join(" ")}
                        </h3>
                        <p className="text-[11px] text-[#72787c] font-semibold">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-6 text-sm ${u.activo ? "text-[#1a1c1d]" : "text-[#72787c]"}`}>{u.email}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#e2e2e4] text-[#41484c] text-[11px] font-bold">
                      {u.rol ? (ROLE_LABELS[u.rol] || u.rol) : "Sin Rol"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {u.activo ? (
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
                    <div className={`flex justify-end gap-2 transition-opacity ${!u.activo ? "opacity-50" : "opacity-0 group-hover:opacity-100"}`}>
                      <button
                        onClick={() => handleOpenEdit(u)}
                        disabled={!u.activo}
                        className="p-1.5 text-[#023143] bg-[#c2e8ff]/50 hover:bg-[#c2e8ff] rounded-md transition-all flex items-center justify-center"
                        title="Editar Rol"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => confirmRevoke(u)}
                        disabled={!u.activo}
                        className="p-1.5 text-[#ba1a1a] bg-[#ffdad6]/50 hover:bg-[#ffdad6] rounded-md transition-all flex items-center justify-center"
                        title="Desactivar usuario"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_off</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                 <tr>
                    <td colSpan={5} className="py-8 text-center text-[#72787c] text-sm">No hay empleados registrados.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Creacion / Edicion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/40 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#e2e2e4] flex justify-between items-center bg-[#f9f9fb]">
              <h2 className="text-[20px] font-bold text-[#1a1c1d]">{editingId ? "Editar Rol de Empleado" : "Crear Nuevo Usuario"}</h2>
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
                    disabled={!!editingId} // No se permite cambiar nombre en edición según API
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143] disabled:bg-[#f9f9fb] disabled:text-[#72787c]"
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
                    {rolesList.map((r) => (
                      <option key={r.idRol} value={r.nombre}>
                        {ROLE_LABELS[r.nombre] || r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-bold text-[#41484c] mb-1.5">
                    Correo corporativo <span className="text-[#c1c7cc] font-normal">(acceso institucional)</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingId} // No se permite cambiar correo en edición
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143] disabled:bg-[#f9f9fb] disabled:text-[#72787c]"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* Dynamic Permissions */}
              <div>
                <h3 className="text-[14px] font-bold text-[#1a1c1d] mb-4 border-b border-[#e2e2e4] pb-2">
                  Permisos del Rol (Solo Lectura)
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  {Object.entries(PERM_LABELS).map(([code, label]) => {
                    const isChecked = selectedRoleFuncs.includes(code);
                    return (
                      <label key={code} className="flex items-center justify-between group opacity-80 cursor-not-allowed">
                        <span className="text-[13px] font-medium text-[#41484c]">
                          {label}
                        </span>
                        <div className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isChecked}
                            readOnly
                          />
                          <div className={`w-9 h-5 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${isChecked ? "bg-[#023143] after:translate-x-full after:border-white" : "bg-[#c1c7cc]"}`}></div>
                        </div>
                      </label>
                    );
                  })}
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
                disabled={loading || !formData.name || !formData.email || !formData.baseRole}
                className="px-5 py-2 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Guardando...
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
            <h3 className="text-[18px] font-bold text-[#1a1c1d] mb-2">¿Desactivar usuario?</h3>
            <p className="text-[13px] text-[#41484c] mb-6">
              Estás a punto de deshabilitar a <b>{[targetUser.nombre, targetUser.apellidos].join(" ")}</b>. El usuario quedará inactivo y perderá acceso al sistema al instante.
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
