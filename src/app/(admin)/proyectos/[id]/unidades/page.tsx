import UnitsOverviewView from "@/modules/inventario/components/UnitsOverviewView";

export const dynamic = "force-dynamic";

type ProjectUnitsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectUnitsPage({ params }: ProjectUnitsPageProps) {
  const { id } = await params;

  return (
    <>
      <UnitsOverviewView projectId={id} />
    </>
  );
}
