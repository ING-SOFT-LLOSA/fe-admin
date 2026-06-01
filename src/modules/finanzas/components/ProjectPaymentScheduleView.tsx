"use client";

import FinancePaymentScheduleView from "@/modules/finanzas/components/FinancePaymentScheduleView";

type ProjectPaymentScheduleViewProps = {
  projectId: string;
};

export default function ProjectPaymentScheduleView({
  projectId,
}: ProjectPaymentScheduleViewProps) {
  return <FinancePaymentScheduleView initialProjectId={projectId} />;
}
