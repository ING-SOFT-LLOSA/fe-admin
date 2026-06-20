"use client";

import FinancePaymentScheduleView from "@/modules/finanzas/components/FinancePaymentScheduleView";

type ProjectPaymentScheduleViewProps = {
  readonly projectId: string;
};

export default function ProjectPaymentScheduleView({
  projectId,
}: Readonly<ProjectPaymentScheduleViewProps>) {
  return <FinancePaymentScheduleView initialProjectId={projectId} />;
}
