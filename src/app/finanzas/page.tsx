import AdminLayout from "@/components/AdminLayout";
import FinancePaymentScheduleView from "@/components/backoffice/FinancePaymentScheduleView";

type FinancePageProps = {
  searchParams: Promise<{
    project?: string;
  }>;
};

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const { project } = await searchParams;

  return (
    <AdminLayout>
      <FinancePaymentScheduleView initialProjectId={project ?? null} />
    </AdminLayout>
  );
}
