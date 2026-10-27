import { request } from './client';
import { VaultHealthData, IntegrityScanResult } from '../types';

export const vaultApi = {
  getHealth: () => request<VaultHealthData>('/vault/health'),

  runIntegrityScan: () =>
    request<IntegrityScanResult>('/vault/integrity-scan', {
      method: 'POST',
    }),
};
