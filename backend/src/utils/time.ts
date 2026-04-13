export function subDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() - amount);
  return next;
}

