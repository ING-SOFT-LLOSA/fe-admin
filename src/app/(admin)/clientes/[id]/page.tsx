import ClienteProfileView from "@/modules/clientes/components/ClienteProfileView";

export default async function ClienteProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClienteProfileView clientId={id} />;
}
