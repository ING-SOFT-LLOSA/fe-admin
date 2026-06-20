import ClienteProfileView from "@/modules/clientes/components/ClienteProfileView";

type ClienteProfilePageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function ClienteProfilePage({ params }: Readonly<ClienteProfilePageProps>) {
  const { id } = await params;
  return <ClienteProfileView clientId={id} />;
}
