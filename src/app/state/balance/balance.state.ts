import type { Balances, Resolution } from '../../core/api/generated';

export interface BalanceState {
  balances: Balances | null;
  resolution: Resolution | null;
  loading: boolean;
  error: string | null;
}

export const initialBalanceState: BalanceState = {
  balances: null,
  resolution: null,
  loading: false,
  error: null,
};
