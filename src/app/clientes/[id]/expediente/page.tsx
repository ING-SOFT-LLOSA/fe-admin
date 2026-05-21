import AdminLayout from "@/components/AdminLayout";
import ClientExpedienteView from "@/components/backoffice/ClientExpedienteView";

type ClientExpedientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientExpedientePage({ params }: ClientExpedientePageProps) {
  const { id } = await params;

  return (
    <AdminLayout>
      <ClientExpedienteView clientId={Number(id)} />
    </AdminLayout>
  );
}
