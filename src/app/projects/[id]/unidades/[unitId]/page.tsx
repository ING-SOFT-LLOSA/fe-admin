import AdminLayout from "@/components/AdminLayout";
import UnitDetailView from "@/components/backoffice/UnitDetailView";
import { getSeedProjectIds, getSeedUnitIds } from "@/lib/backoffice/seed";

type ProjectUnitDetailPageProps = {
  params: Promise<{
    id: string;
    unitId: string;
  }>;
};

export function generateStaticParams() {
  return getSeedProjectIds().flatMap((id) =>
    getSeedUnitIds(id).map((unitId) => ({
      id,
      unitId,
    })),
  );
}

export default async function ProjectUnitDetailPage({ params }: ProjectUnitDetailPageProps) {
  const { id, unitId } = await params;

  return (
    <AdminLayout>
      <UnitDetailView projectId={id} unitId={unitId} />
    </AdminLayout>
  );
}
