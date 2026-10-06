export function calculatePlannedDate(startedAt: string | Date, tatHours: number): string {
  const start = new Date(startedAt);
  // Add tatHours to start time
  // If we had working_hours calendar, we would skip weekends/holidays here.
  // For now, simple calendar hours addition
  const planned = new Date(start.getTime() + tatHours * 60 * 60 * 1000);
  return planned.toISOString();
}

export function determineOverdueStatus(plannedAt: string | null, completedAt: string | null): 'On Time' | 'Due Soon' | 'Due' | 'Overdue' | 'Completed On Time' | 'Completed Late' | 'Active' {
  if (!plannedAt) return 'Active';

  const planned = new Date(plannedAt);
  const now = new Date();

  if (completedAt) {
    const actual = new Date(completedAt);
    return actual <= planned ? 'Completed On Time' : 'Completed Late';
  }

  const msRemaining = planned.getTime() - now.getTime();
  const hoursRemaining = msRemaining / (1000 * 60 * 60);

  if (hoursRemaining < 0) return 'Overdue';
  if (hoursRemaining <= 2) return 'Due Soon'; // arbitrary 2 hour threshold
  if (hoursRemaining <= 12) return 'Due';
  return 'On Time';
}
