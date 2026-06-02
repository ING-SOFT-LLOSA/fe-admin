import ClientExpedienteView from "@/modules/legal/components/ClientExpedienteView";

export default function ExpedienteLegalPage({ params }: { params: { clientId: string } }) {
  // We need to parse clientId to number since the component expects a number, or just pass the string if it changed.
  // We'll pass it as a number assuming client IDs are numbers in mock.
  return (
    <div className="p-6">
      <ClientExpedienteView clientId={Number(params.clientId)} />
    </div>
  );
}
