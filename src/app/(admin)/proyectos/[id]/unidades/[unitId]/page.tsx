import UnitDetailView from "@/modules/inventario/components/UnitDetailView";

export const dynamic = "force-dynamic";

type ProjectUnitDetailPageProps = {
  params: Promise<{
    id: string;
    unitId: string;
  }>;
};

export default async function ProjectUnitDetailPage({ params }: ProjectUnitDetailPageProps) {
  const { id, unitId } = await params;

  return (
    <>
      <UnitDetailView projectId={id} unitId={unitId} />
    </>
  );
}
