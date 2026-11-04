import type { Suggestion } from './generated';

export type SuggestionDirection = 'DEBIT' | 'CREDIT';

export interface SuggestionProvenance {
  account_id: string | null;
  effective_date: string | null;
  direction: SuggestionDirection | null;
  reference: string | null;
  description: string | null;
  import_batch_id: string | null;
}

export type SuggestionWithProvenance = Suggestion & SuggestionProvenance;

export function provenanceOf(suggestion: Suggestion): SuggestionProvenance {
  const provenance = suggestion as Suggestion & Partial<SuggestionProvenance>;
  return {
    account_id: provenance.account_id ?? null,
    effective_date: provenance.effective_date ?? null,
    direction: provenance.direction ?? null,
    reference: provenance.reference ?? null,
    description: provenance.description ?? null,
    import_batch_id: provenance.import_batch_id ?? null,
  };
}

export function isIncomeSuggestion(suggestion: Suggestion): boolean {
  return provenanceOf(suggestion).direction === 'CREDIT';
}

export function isImportedSuggestion(suggestion: Suggestion): boolean {
  return provenanceOf(suggestion).direction !== null;
}
