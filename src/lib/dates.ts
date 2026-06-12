const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "en retard de 2 j", "aujourd'hui", "dans 3 j" */
export function formatDue(dueAt: number): string {
  const days = Math.round((dueAt - Date.now()) / DAY_MS);
  if (days < -1) return `en retard de ${-days} j`;
  if (days === -1) return 'en retard de 1 j';
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  return `dans ${days} j`;
}

export function isOverdue(dueAt: number): boolean {
  return dueAt < Date.now();
}
