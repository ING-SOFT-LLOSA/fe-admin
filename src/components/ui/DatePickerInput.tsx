"use client";

/**
 * DatePickerInput — selector de fecha amigable con validación de fecha futura.
 *
 * El backend valida @Future (fechaVencimiento > hoy). Este componente:
 * - Bloquea visualmente fechas pasadas (min = mañana)
 * - Muestra error inline si el usuario intenta ingresar una fecha pasada
 * - Tiene estilo consistente con el design system
 */

import { useId } from "react";

interface DatePickerInputProps {
    readonly label?: string;
    readonly value: string; // "YYYY-MM-DD"
    readonly onChange: (value: string) => void;
    readonly error?: string;
    readonly className?: string;
    readonly size?: "sm" | "md";
    readonly disabled?: boolean;
    /** Por defecto true — el backend rechaza fechas pasadas con @Future */
    readonly futureOnly?: boolean;
}

/** Devuelve "YYYY-MM-DD" del día siguiente a hoy en hora local. */
function getTomorrow(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Devuelve "YYYY-MM-DD" de hoy en hora local. */
function getToday(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Formatea "YYYY-MM-DD" como "DD/MM/YYYY" para mostrar. */
export function formatDateDisplay(isoDate: string): string {
    if (!isoDate) return "";
    const [y, m, d] = isoDate.split("-");
    return `${d}/${m}/${y}`;
}

export default function DatePickerInput({
    label,
    value,
    onChange,
    error,
    className = "",
    size = "md",
    disabled = false,
    futureOnly = true,
}: DatePickerInputProps) {
    const inputId = useId();
    const minDate = futureOnly ? getTomorrow() : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        onChange(newVal);
    };

    const paddingClass = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
    const hasError = Boolean(error);

    const borderClass = hasError
        ? "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-400/20"
        : "border-slate-200 dark:border-white/10 focus:border-build-accent focus:ring-build-accent/20";

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40"
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <input
                    id={inputId}
                    type="date"
                    value={value}
                    min={minDate}
                    disabled={disabled}
                    onChange={handleChange}
                    className={[
                        "w-full rounded-lg border bg-white dark:bg-white/5",
                        "text-build-main dark:text-white outline-none",
                        "focus:ring-2 transition-colors",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
                        borderClass,
                    ].join(" ")}
                />
            </div>

            {/* Mensaje de error inline */}
            {hasError && (
                <p className="flex items-center gap-1 text-[10px] font-semibold text-red-500 dark:text-red-400">
                    <span className="material-symbols-outlined text-[12px]">error</span>
                    {error}
                </p>
            )}

            {/* Sugerencia informativa cuando no hay error */}
            {!hasError && futureOnly && !value && (
                <p className="text-[10px] text-slate-400 dark:text-white/30">
                    Solo fechas posteriores a hoy
                </p>
            )}
        </div>
    );
}

/**
 * Valida que la fecha seleccionada sea futura (> hoy).
 * Usa la misma lógica que el backend (@Future).
 * Retorna mensaje de error o null si es válida.
 */
export function validateFutureDate(isoDate: string): string | null {
    if (!isoDate) return "La fecha es obligatoria";
    const today = getToday();
    if (isoDate <= today) {
        return "La fecha debe ser posterior a hoy";
    }
    return null;
}
