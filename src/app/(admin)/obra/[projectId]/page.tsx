import ConstructionProgressView from "@/modules/obra/components/ConstructionProgressView";

type ObraProjectPageProps = {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
};

export default async function ObraProjectPage({ params }: Readonly<ObraProjectPageProps>) {
  const { projectId } = await params;

  return <ConstructionProgressView projectId={projectId} context="obra" />;
}
