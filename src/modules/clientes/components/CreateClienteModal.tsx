"use client";
 
import { useState, useId } from "react";
import { registerCliente } from "@/lib/api/users";
import { validateClienteForm } from "@/modules/clientes/utils/validation";
 
type CreateClienteModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
};
 
const EMPTY_FORM = {
  nombre: "",
  apellidos: "",
  email: "",
  telefono: "",
  documentoIdentidad: "",
};
 
export default function CreateClienteModal({
  open,
  onClose,
  onCreated,
}: Readonly<CreateClienteModalProps>) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const nombreId = useId();
  const apellidosId = useId();
  const emailId = useId();
  const docId = useId();
  const telefonoId = useId();
 
  function handleClose() {
    if (loading) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setError(null);
    setSuccess(null);
    onClose();
  }
 
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
 
  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
 
    const validationErrors = validateClienteForm(form, true);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
 
    setLoading(true);
 
    try {
      await registerCliente({
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim() ? form.telefono.replaceAll(/\s+/g, "") : undefined,
        documentoIdentidad: form.documentoIdentidad.trim() || undefined,
        tipoUsuario: "CLIENTE",
      });
 
      setSuccess("Cliente creado correctamente.");
      onCreated();
 
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
    } finally {
      setLoading(false);
    }
  }
 
  if (!open) return null;
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
        <div className="px-8 py-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-white dark:bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-build-main dark:text-white">person_add</span>
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-build-main dark:text-white">Crear cliente</h2>
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
 
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-[13px] text-red-800 dark:text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-[#27a85e]/30 bg-[#d6f0e0] px-4 py-3 text-[13px] font-semibold text-[#1c663b]">
              {success}
            </div>
          )}
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor={nombreId} className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                Nombres *
              </label>
              <input
                id={nombreId}
                required
                value={form.nombre}
                onChange={(e) => handleFieldChange("nombre", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.nombre
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="Carlos"
              />
              {errors.nombre && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">{errors.nombre}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor={apellidosId} className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                Apellidos *
              </label>
              <input
                id={apellidosId}
                required
                value={form.apellidos}
                onChange={(e) => handleFieldChange("apellidos", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.apellidos
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="Ruiz"
              />
              {errors.apellidos && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">{errors.apellidos}</p>
              )}
            </div>
          </div>
 
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
              Correo electrónico *
            </label>
            <input
              id={emailId}
              type="email"
              required
              value={form.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                errors.email
                  ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
                  : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              }`}
              placeholder="cliente@ejemplo.com"
            />
            {errors.email && (
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">{errors.email}</p>
            )}
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor={docId} className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                DNI / CE
              </label>
              <input
                id={docId}
                value={form.documentoIdentidad}
                onChange={(e) => handleFieldChange("documentoIdentidad", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.documentoIdentidad
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="Opcional"
              />
              {errors.documentoIdentidad && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">{errors.documentoIdentidad}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor={telefonoId} className="block text-[11px] font-bold text-slate-500 dark:text-white/60 uppercase tracking-wider">
                Teléfono
              </label>
              <input
                id={telefonoId}
                value={form.telefono}
                onChange={(e) => handleFieldChange("telefono", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm text-build-main dark:text-white focus:outline-none transition-all ${
                  errors.telefono
                    ? "border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500/20"
                    : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                }`}
                placeholder="+51 999 888 777"
              />
              {errors.telefono && (
                <p className="text-xs font-semibold text-red-500 dark:text-red-400 mt-1">{errors.telefono}</p>
              )}
            </div>
          </div>
 
          <div className="flex justify-end gap-3 pt-4 mt-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-build-main dark:hover:text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className="px-6 py-2.5 bg-build-main text-white rounded-lg text-sm font-bold hover:bg-build-main/90 transition-all shadow-sm disabled:opacity-60 flex items-center gap-2"
            >
              {loading ? "Creando..." : "Crear cliente"}
              {!loading && <span className="material-symbols-outlined text-[18px]">check</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
