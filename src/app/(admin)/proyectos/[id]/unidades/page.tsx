import UnitsOverviewView from "@/modules/inventario/components/UnitsOverviewView";

export const dynamic = "force-dynamic";

type ProjectUnitsPageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function ProjectUnitsPage({ params }: Readonly<ProjectUnitsPageProps>) {
  const { id } = await params;

  return (
    <UnitsOverviewView projectId={id} />
  );
}
