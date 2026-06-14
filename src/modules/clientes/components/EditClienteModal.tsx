"use client";

import { useState, useEffect } from "react";
import { updateCliente } from "@/lib/api/users";
import type { ClienteRow } from "@/types/user";

type EditClienteModalProps = {
  open: boolean;
  cliente: ClienteRow | null;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditClienteModal({
  open,
  cliente,
  onClose,
  onUpdated,
}: EditClienteModalProps) {
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    documentoIdentidad: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (cliente && open) {
      // Intentar extraer el primer y segundo nombre si vienen pegados, 
      // pero por simplicidad usaremos todo como "nombre" ya que la tabla los concatena.
      // Lo ideal es tener el original, pero como ClienteRow tiene `name` combinado:
      const parts = cliente.name.split(" ");
      setForm({
        nombre: parts[0] || "",
        apellidos: parts.slice(1).join(" ") || "",
        email: cliente.email,
        telefono: cliente.phone !== "—" ? cliente.phone : "",
        documentoIdentidad: cliente.dni !== "—" ? cliente.dni : "",
      });
      setErrors({});
    }
  }, [cliente, open]);

  function handleClose() {
    if (loading) return;
    setError(null);
    setSuccess(null);
    onClose();
  }

  const validateForm = (data: typeof form): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    if (!data.nombre || !data.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    }

    if (!data.apellidos || !data.apellidos.trim()) {
      newErrors.apellidos = "Los apellidos son obligatorios.";
    }

    if (data.telefono && data.telefono.trim() !== "") {
      const phoneClean = data.telefono.replace(/\s+/g, "");
      const phoneRegex = /^\+519\d{8}$/;
      if (!phoneRegex.test(phoneClean)) {
        newErrors.telefono = "El teléfono debe iniciar con '+51' y tener 9 números (ej. +51 999 888 777).";
      }
    }

    if (data.documentoIdentidad && data.documentoIdentidad.trim() !== "") {
      const docTrimmed = data.documentoIdentidad.trim();
      if (!/^[0-9]+$/.test(docTrimmed)) {
        newErrors.documentoIdentidad = "El documento debe contener solo números.";
      } else if (docTrimmed.length !== 8 && docTrimmed.length !== 11) {
        newErrors.documentoIdentidad = "Debe ser un DNI (8 dígitos) o RUC (11 dígitos).";
      }
    }

    return newErrors;
  };

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cliente) return;
    
    setError(null);
    setSuccess(null);

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      const firstErrorKey = Object.keys(validationErrors)[0];
      const element = document.getElementsByName(firstErrorKey)[0];
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        (element as HTMLInputElement).focus();
      }
      return;
    }

    setLoading(true);

    try {
      await updateCliente(cliente.id, {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() ? form.telefono.replace(/\s+/g, "") : undefined,
        documentoIdentidad: form.documentoIdentidad.trim() || undefined,
        tipoUsuario: "CLIENTE",
      });

      setSuccess("Información del cliente actualizada correctamente.");
      onUpdated();

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el cliente.");
    } finally {
      setLoading(false);
    }
  }

  if (!open || !cliente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-white/5 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-build-main dark:text-white">edit</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-build-main dark:text-white">Editar cliente</h2>
              <p className="text-[12px] text-slate-500 dark:text-white/60 font-medium mt-0.5">
                Actualizar información de contacto y documentos
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className="text-slate-400 dark:text-white/50 hover:text-build-main dark:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4" noValidate>
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-[13px] font-semibold text-green-800 dark:text-green-400">
              {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                Nombre *
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={(e) => handleFieldChange("nombre", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.nombre 
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20" 
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="Andre"
              />
              {errors.nombre && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.nombre}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                Apellidos *
              </label>
              <input
                name="apellidos"
                value={form.apellidos}
                onChange={(e) => handleFieldChange("apellidos", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.apellidos 
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20" 
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="Contreras"
              />
              {errors.apellidos && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.apellidos}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
              Correo electrónico *
            </label>
            <input
              type="email"
              disabled
              value={form.email}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-400 dark:text-white/40 bg-slate-50 dark:bg-white/5 cursor-not-allowed outline-none"
              placeholder="cliente@ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                DNI / CE
              </label>
              <input
                name="documentoIdentidad"
                value={form.documentoIdentidad}
                onChange={(e) => handleFieldChange("documentoIdentidad", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.documentoIdentidad 
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20" 
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="12345678"
              />
              {errors.documentoIdentidad && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.documentoIdentidad}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                Teléfono
              </label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={(e) => handleFieldChange("telefono", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.telefono 
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20" 
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="+51 999 888 777"
              />
              {errors.telefono && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400">{errors.telefono}</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-white/60 leading-relaxed">
            Los cambios se reflejarán inmediatamente en la base de datos de Llosa.
          </p>

          <div className="flex justify-end gap-3 pt-4 mt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:bg-white/5 hover:text-build-main dark:text-white rounded-xl transition-colors"
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
                  Guardando…
                </>
              ) : (
                <>
                  Guardar cambios
                  <span className="material-symbols-outlined text-[18px]">save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
