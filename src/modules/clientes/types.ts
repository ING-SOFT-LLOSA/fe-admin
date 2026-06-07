/** Shape of assignment data from mock/api getMockAssignmentsByClient */
export interface MockAssignment {
  clientId: number;
  unitId: string;
  unitLabel: string;
  projectName: string;
  financing: string;
  assignedAt: string;
  status: string;
}
