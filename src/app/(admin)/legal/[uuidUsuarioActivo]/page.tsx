import { Metadata } from "next";
import ExpedienteDetailView from "@/modules/legal/components/ExpedienteDetailView";

export const metadata: Metadata = {
  title: "Detalle de Expediente Legal | Backoffice",
  description: "Detalle y seguimiento del expediente legal y unidades vinculadas.",
};

export default async function ExpedienteDetailRoute({ params }: { params: Promise<{ uuidUsuarioActivo: string }> }) {
  const { uuidUsuarioActivo } = await params;
  return (
    <div className="p-6">
      <ExpedienteDetailView uuidUsuarioActivo={uuidUsuarioActivo} />
    </div>
  );
}
