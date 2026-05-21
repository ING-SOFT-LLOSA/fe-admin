import { redirect } from "next/navigation";

import { getSeedProjectIds } from "@/lib/backoffice/seed";

type ProjectPaymentsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return getSeedProjectIds().map((id) => ({ id }));
}

export default async function ProjectPaymentsPage({ params }: ProjectPaymentsPageProps) {
  const { id } = await params;
  redirect(`/finanzas?project=${id}`);
}
