import AdminLayout from "@/components/AdminLayout";
import UnitsOverviewView from "@/components/backoffice/UnitsOverviewView";
import { getSeedProjectIds } from "@/lib/backoffice/seed";

type ProjectUnitsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return getSeedProjectIds().map((id) => ({ id }));
}

export default async function ProjectUnitsPage({ params }: ProjectUnitsPageProps) {
  const { id } = await params;

  return (
    <AdminLayout>
      <UnitsOverviewView projectId={id} />
    </AdminLayout>
  );
}
