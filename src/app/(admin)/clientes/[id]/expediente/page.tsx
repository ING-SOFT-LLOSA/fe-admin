import ClientExpedienteView from "@/modules/legal/components/ClientExpedienteView";

type ClientExpedientePageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function ClientExpedientePage({ params }: Readonly<ClientExpedientePageProps>) {
  const { id } = await params;

  return <ClientExpedienteView clientId={Number(id)} />;
}
