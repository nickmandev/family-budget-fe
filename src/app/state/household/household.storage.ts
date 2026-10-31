export const HOUSEHOLD_SELECTION_STORAGE_KEY =
  'family-budget-selected-household';

/**
 * Reads the persisted active household so the selection survives reloads.
 */
export function readSelectedHouseholdId(): string | null {
  return localStorage.getItem(HOUSEHOLD_SELECTION_STORAGE_KEY);
}

export function storeSelectedHouseholdId(id: string | null): void {
  if (id) {
    localStorage.setItem(HOUSEHOLD_SELECTION_STORAGE_KEY, id);
    return;
  }

  clearSelectedHouseholdId();
}

export function clearSelectedHouseholdId(): void {
  localStorage.removeItem(HOUSEHOLD_SELECTION_STORAGE_KEY);
}
