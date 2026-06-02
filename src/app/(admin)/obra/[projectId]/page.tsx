import ConstructionProgressView from "@/modules/obra/components/ConstructionProgressView";

type ObraProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ObraProjectPage({ params }: ObraProjectPageProps) {
  const { projectId } = await params;

  return <ConstructionProgressView projectId={projectId} context="obra" />;
}
