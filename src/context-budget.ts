export const CONTEXT_BUDGETS = {
  sessionStartCharacters: 400,
  sessionStartEstimatedTokens: 100,
  memoryContextCharacters: 2400,
  memoryContextEstimatedTokens: 600,
  memorySearchSnippetCharacters: 300,
  memorySearchDefaultResults: 5,
  memorySearchMaxResults: 8,
  agentCompletionNoteCharacters: 120,
} as const;

export function estimatedTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateAtBoundary(text: string, maxCharacters: number, suffix = ""): string {
  if (text.length <= maxCharacters) return text;
  if (suffix.length >= maxCharacters) return suffix.slice(0, maxCharacters);

  const available = maxCharacters - suffix.length;
  const prefix = text.slice(0, available + 1);
  const boundary = prefix.lastIndexOf(" ");
  const trimmed = prefix.slice(0, boundary > 0 ? boundary : available).trimEnd();
  return `${trimmed}${suffix}`;
}
