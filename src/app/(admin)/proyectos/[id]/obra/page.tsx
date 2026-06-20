import ConstructionProgressView from "@/modules/obra/components/ConstructionProgressView";

export const dynamic = "force-dynamic";

type ProjectObraPageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function ProjectObraPage({ params }: Readonly<ProjectObraPageProps>) {
  const { id } = await params;

  return (
    <>
      <ConstructionProgressView projectId={id} context="project" />
    </>
  );
}
