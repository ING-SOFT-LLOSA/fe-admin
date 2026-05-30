"use client";

import { useState, useEffect } from "react";

import { registerCliente, registerEmpleado, fetchRoles } from "@/lib/api/users";
import { getFirebaseAuth } from "@/lib/firebase";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import type { Rol } from "@/types/user";

type CreateClienteModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const EMPTY_FORM = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  documentoIdentidad: "",
  tipoUsuario: "CLIENTE" as "CLIENTE" | "EMPLEADO",
  rolId: "",
};

export default function CreateClienteModal({
  open,
  onClose,
  onCreated,
}: CreateClienteModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);

  useEffect(() => {
    if (open) {
      fetchRoles().then(setRoles).catch(console.error);
    }
  }, [open]);

  function handleClose() {
    if (loading) return;
    setForm(EMPTY_FORM);
    setError(null);
    setSuccess(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // 1. Verificar si el correo ya existe en Firebase
      const auth = getFirebaseAuth();
      try {
        const methods = await fetchSignInMethodsForEmail(auth, form.email.trim());
        if (methods && methods.length > 0) {
          throw new Error("Este correo ya se encuentra registrado. Por favor, utiliza otro.");
        }
      } catch (authErr: any) {
        // En caso Firebase tenga "Email Enumeration Protection" activado, ignoramos el error aquí 
        // y dejamos que el backend se encargue. Pero si es el error específico de auth, lo mostramos.
        if (authErr.message && authErr.message.includes("registrado")) throw authErr;
      }

      if (form.tipoUsuario === "CLIENTE") {
        await registerCliente({
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim() || undefined,
          documentoIdentidad: form.documentoIdentidad.trim() || undefined,
          tipoUsuario: "CLIENTE",
        });
      } else {
        if (!form.rolId) throw new Error("Debe seleccionar un rol para el empleado.");
        await registerEmpleado({
          nombre: form.nombre.trim(),
          apellidos: form.apellidos.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim() || undefined,
          tipoUsuario: "EMPLEADO",
          idRol: parseInt(form.rolId, 10),
        });
      }

      setSuccess(
        "Usuario creado. Se envió un correo para que defina su contraseña e inicie sesión.",
      );
      onCreated();

      setTimeout(() => {
        handleClose();
      }, 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-build-main">person_add</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-build-main">Crear usuario</h2>
              <p className="text-[12px] text-slate-500 font-medium mt-0.5">
                Registro en Firebase y base de datos Llosa
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="text-slate-400 hover:text-build-main transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-[#27a85e]/30 bg-[#d6f0e0] px-4 py-3 text-[13px] font-semibold text-[#1c663b]">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nombre *
              </label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Andre"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Apellidos *
              </label>
              <input
                required
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Contreras"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Correo electrónico *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tipo de Usuario *
              </label>
              <select
                value={form.tipoUsuario}
                onChange={(e) => setForm((f) => ({ ...f, tipoUsuario: e.target.value as "CLIENTE" | "EMPLEADO" }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              >
                <option value="CLIENTE">Cliente</option>
                <option value="EMPLEADO">Empleado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                DNI / RUC
              </label>
              <input
                value={form.documentoIdentidad}
                onChange={(e) => setForm((f) => ({ ...f, documentoIdentidad: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="12345678"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Teléfono
              </label>
              <input
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="+51 999 888 777"
              />
            </div>
          </div>

          {form.tipoUsuario === "EMPLEADO" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Rol del Empleado *
              </label>
              <select
                required
                value={form.rolId}
                onChange={(e) => setForm((f) => ({ ...f, rolId: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-build-main focus:outline-none focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              >
                <option value="">Seleccione un rol</option>
                {roles.map(r => (
                  <option key={r.idRol} value={r.idRol}>{r.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <p className="text-[11px] text-slate-500 leading-relaxed">
            El usuario recibirá un correo de Firebase para crear su contraseña automáticamente.
          </p>

          <div className="flex justify-end gap-3 pt-4 mt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-build-main rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="px-6 py-2.5 bg-build-main text-white rounded-xl text-sm font-bold hover:bg-build-main/90 transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Creando…
                </>
              ) : (
                <>
                  Crear usuario
                  <span className="material-symbols-outlined text-[18px]">check</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
