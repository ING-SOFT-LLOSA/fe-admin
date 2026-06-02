import ClientExpedienteView from "@/modules/legal/components/ClientExpedienteView";

type ClientExpedientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientExpedientePage({ params }: ClientExpedientePageProps) {
  const { id } = await params;

  return (
    <>
      <ClientExpedienteView clientId={Number(id)} />
    </>
  );
}
