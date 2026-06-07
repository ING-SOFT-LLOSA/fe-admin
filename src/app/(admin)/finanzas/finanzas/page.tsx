import FinancePaymentScheduleView from "@/modules/finanzas/components/FinancePaymentScheduleView";

type FinancePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const { project } = await searchParams;

  return (
    <>
      <FinancePaymentScheduleView initialProjectId={project ?? null} />
    </>
  );
}
