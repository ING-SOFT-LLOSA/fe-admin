"use client";

import FinancePaymentScheduleView from "@/components/backoffice/FinancePaymentScheduleView";

type ProjectPaymentScheduleViewProps = {
  projectId: string;
};

export default function ProjectPaymentScheduleView({
  projectId,
}: ProjectPaymentScheduleViewProps) {
  return <FinancePaymentScheduleView initialProjectId={projectId} />;
}
