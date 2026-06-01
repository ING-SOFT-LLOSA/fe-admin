import UnitDetailView from "@/modules/inventario/components/UnitDetailView";
import { getSeedProjectIds, getSeedUnitIds } from "@/modules/shared/workspace/seed";

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
    <>
      <UnitDetailView projectId={id} unitId={unitId} />
    </>
  );
}
