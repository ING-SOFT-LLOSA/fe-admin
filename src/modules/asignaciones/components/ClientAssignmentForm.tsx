import { useState } from "react";
import type { BackofficeUnit, UnitClientAssignment } from "@/modules/shared/workspace/types";

const EMPTY_CLIENT: UnitClientAssignment = {
  clientId: -1,
  fullName: "",
  dni: "",
  email: "",
  phone: "",
  separationDate: "",
  paymentMode: "credito_directo",
};

type ClientAssignmentFormProps = {
  unit: BackofficeUnit;
  onSave: (client: UnitClientAssignment) => void;
  onUnlink: () => void;
};

export default function ClientAssignmentForm({ unit, onSave, onUnlink }: ClientAssignmentFormProps) {
  const [draftClient, setDraftClient] = useState<UnitClientAssignment>(
    unit.client ?? EMPTY_CLIENT,
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Nombre completo
        </label>
        <input
          value={draftClient.fullName}
          onChange={(event) =>
            setDraftClient((current) => ({ ...current, fullName: event.target.value }))
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            DNI
          </label>
          <input
            value={draftClient.dni}
            onChange={(event) =>
              setDraftClient((current) => ({ ...current, dni: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fecha de separacion
          </label>
          <input
            type="date"
            value={draftClient.separationDate}
            onChange={(event) =>
              setDraftClient((current) => ({
                ...current,
                separationDate: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Correo
          </label>
          <input
            type="email"
            value={draftClient.email}
            onChange={(event) =>
              setDraftClient((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Telefono
          </label>
          <input
            value={draftClient.phone}
            onChange={(event) =>
              setDraftClient((current) => ({ ...current, phone: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Modalidad de pago
        </label>
        <select
          value={draftClient.paymentMode}
          onChange={(event) =>
            setDraftClient((current) => ({
              ...current,
              paymentMode: event.target.value as UnitClientAssignment["paymentMode"],
            }))
          }
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
        >
          <option value="credito_directo">Credito directo</option>
          <option value="credito_hipotecario">Credito hipotecario</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onSave(draftClient)}
          className="flex-1 rounded-xl bg-build-main px-4 py-2.5 text-sm font-bold text-white hover:bg-build-main/90"
        >
          Guardar cliente
        </button>
        {unit.client ? (
          <button
            type="button"
            onClick={onUnlink}
            className="rounded-xl border border-red-600/20 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            Desvincular
          </button>
        ) : null}
      </div>
    </div>
  );
}
