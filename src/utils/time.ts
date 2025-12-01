/**
 * Time utilities
 */

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRemainingTime(elapsed: number, max: number): string {
  const remaining = Math.max(0, max - elapsed);
  return formatDuration(remaining);
}
