/** ISO-8601 Zulu time fragment for terminal readouts (HH:MM:SSZ) */
export function formatZuluTime(date = new Date()): string {
  return `${date.toISOString().slice(11, 19)}Z`;
}
