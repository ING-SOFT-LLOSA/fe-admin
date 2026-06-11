import ClientExpedienteView from "@/modules/legal/components/ClientExpedienteView";

type Props = {
  params: Promise<{ clientId: string }>;
};

export default async function ExpedienteLegalPage({ params }: Props) {
  const { clientId } = await params;
  return (
    <div className="p-6">
      <ClientExpedienteView clientId={Number(clientId)} />
    </div>
  );
}
