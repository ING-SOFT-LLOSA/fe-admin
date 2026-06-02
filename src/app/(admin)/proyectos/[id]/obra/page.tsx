import ConstructionProgressView from "@/modules/obra/components/ConstructionProgressView";

export const dynamic = "force-dynamic";

type ProjectObraPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectObraPage({ params }: ProjectObraPageProps) {
  const { id } = await params;

  return (
    <>
      <ConstructionProgressView projectId={id} context="project" />
    </>
  );
}
