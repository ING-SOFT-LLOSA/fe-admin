import { Metadata } from "next";
import LegalOverview from "@/modules/legal/components/LegalOverview";

export const metadata: Metadata = {
  title: "Gestión Legal | Backoffice",
  description: "Búsqueda y administración de expedientes y contratos legales.",
};

export default function LegalPage() {
  return <LegalOverview />;
}

