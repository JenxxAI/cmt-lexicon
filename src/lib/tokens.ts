/**
 * Rough token estimate (about 4 characters per token for English).
 * Good enough as a hint on a prompt; it is not an exact tokenizer count.
 */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}
