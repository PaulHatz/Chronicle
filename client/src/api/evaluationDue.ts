/** A review is due on its scheduled calendar day or any later day. */
export function isEvaluationDue(nextEvaluationAt: string | null | undefined): boolean {
  if (!nextEvaluationAt) return false;
  const date = new Date(nextEvaluationAt);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return date.toISOString().slice(0, 10) <= today;
}
