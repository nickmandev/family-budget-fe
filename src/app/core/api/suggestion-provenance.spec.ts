import { SuggestionState, TransactionSource } from './generated';
import type { Suggestion } from './generated';
import { isImportedSuggestion, isIncomeSuggestion, provenanceOf } from './suggestion-provenance';

describe('suggestion provenance helpers', () => {
  const manualSuggestion: Suggestion = {
    id: 'suggestion-1',
    source: TransactionSource.MANUAL,
    amount_minor: 1000,
    merchant: 'Manual merchant',
    state: SuggestionState.SUGGESTED,
    confirmation_count: 0,
  };

  it('defaults missing provenance fields to null for a manual suggestion', () => {
    expect(provenanceOf(manualSuggestion)).toEqual({
      account_id: null,
      effective_date: null,
      direction: null,
      reference: null,
      description: null,
      import_batch_id: null,
    });
    expect(isImportedSuggestion(manualSuggestion)).toBeFalse();
    expect(isIncomeSuggestion(manualSuggestion)).toBeFalse();
  });

  it('identifies an imported credit as income', () => {
    const credit = suggestionWithDirection('CREDIT');

    expect(isImportedSuggestion(credit)).toBeTrue();
    expect(isIncomeSuggestion(credit)).toBeTrue();
  });

  it('identifies an imported debit as a non-income import', () => {
    const debit = suggestionWithDirection('DEBIT');

    expect(isImportedSuggestion(debit)).toBeTrue();
    expect(isIncomeSuggestion(debit)).toBeFalse();
  });
});

function suggestionWithDirection(direction: 'DEBIT' | 'CREDIT'): Suggestion {
  return {
    id: `suggestion-${direction.toLowerCase()}`,
    source: TransactionSource.MANUAL,
    amount_minor: 1000,
    merchant: 'Imported merchant',
    state: SuggestionState.SUGGESTED,
    confirmation_count: 0,
    account_id: 'account-1',
    effective_date: '2026-10-31',
    direction,
    reference: 'statement-reference',
    description: 'Statement description',
    import_batch_id: 'batch-1',
  } as Suggestion;
}
