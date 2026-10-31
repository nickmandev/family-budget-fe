/**
 * Generates an idempotency key for a single logical financial mutation.
 *
 * The backend scopes idempotency to (household_id, key). A key must therefore be
 * created once per user-initiated command and reused if that same command is
 * retried — never regenerated per HTTP attempt.
 *
 * NOTE: the UI currently guards double-submission by disabling submit buttons
 * while a mutation is in flight (the `*Saving()`/`*Loading()` selectors), so a
 * fresh key per dispatched action is safe today. If automatic retries of
 * mutations are ever added, the key must be generated at action-dispatch time
 * and carried on the action instead.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
