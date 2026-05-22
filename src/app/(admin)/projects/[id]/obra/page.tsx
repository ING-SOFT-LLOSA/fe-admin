import ConstructionProgressView from "@/components/backoffice/ConstructionProgressView";
import { getSeedProjectIds } from "@/lib/backoffice/seed";

type ProjectObraPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return getSeedProjectIds().map((id) => ({ id }));
}

export default async function ProjectObraPage({ params }: ProjectObraPageProps) {
  const { id } = await params;

  return (
    <>
      <ConstructionProgressView projectId={id} />
    </>
  );
}
