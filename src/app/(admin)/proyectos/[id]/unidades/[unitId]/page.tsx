import UnitDetailView from "@/modules/inventario/components/UnitDetailView";

export const dynamic = "force-dynamic";

type ProjectUnitDetailPageProps = {
  readonly params: Promise<{
    readonly id: string;
    readonly unitId: string;
  }>;
};

export default async function ProjectUnitDetailPage({ params }: Readonly<ProjectUnitDetailPageProps>) {
  const { id, unitId } = await params;

  return (
    <UnitDetailView projectId={id} unitId={unitId} />
  );
}
