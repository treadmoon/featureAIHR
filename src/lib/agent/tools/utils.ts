/**
 * Escape special characters for Supabase ilike/like queries
 */
export function escapeIlike(input: string): string {
  return input.replace(/[%_]/g, '\\$&');
}
