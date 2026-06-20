import FinancePaymentScheduleView from "@/modules/finanzas/components/FinancePaymentScheduleView";

type FinancePageProps = {
  readonly searchParams: Promise<{
    project?: string;
  }>;
};

export default async function FinancePage({ searchParams }: Readonly<FinancePageProps>) {
  const { project } = await searchParams;

  return (
    <FinancePaymentScheduleView initialProjectId={project ?? null} />
  );
}
