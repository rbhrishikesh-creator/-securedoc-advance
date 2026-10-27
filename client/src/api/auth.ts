import { request } from './client';
import { User, TwoFactorSetupResponse, TwoFactorEnableResponse } from '../types';

export interface LoginResponse {
  message: string;
  token?: string;
  user?: User;
  requires2FA?: boolean;
  tempToken?: string;
  method?: 'totp' | 'email';
  maskedEmail?: string;
  emailOtpPreview?: string;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<{ message: string; user: User; token?: string; devVerifyUrl?: string; emailPreviewUrl?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    request<{ message: string; isVerified: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  verifyCurrent: () =>
    request<{ message: string; isVerified: boolean }>('/auth/verify-current', {
      method: 'POST',
    }),

  resendVerification: (email: string) =>
    request<{ message: string; token?: string; devVerifyUrl?: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (data: { email: string; password: string }) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  validateTwoFactorLogin: (data: { tempToken: string; code: string; isBackupCode?: boolean }) =>
    request<{ message: string; token: string; user: User }>('/auth/2fa/validate-login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  setupTwoFactor: () =>
    request<TwoFactorSetupResponse>('/auth/2fa/setup', {
      method: 'POST',
    }),

  enableTwoFactor: (data: { code: string; secret?: string; method?: 'totp' | 'email' }) =>
    request<TwoFactorEnableResponse>('/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  disableTwoFactor: (password: string) =>
    request<{ message: string }>('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  resendEmailOtp: (tempToken: string) =>
    request<{ message: string; emailPreviewUrl?: string }>('/auth/2fa/resend-email-otp', {
      method: 'POST',
      body: JSON.stringify({ tempToken }),
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; devResetUrl?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  elevateToAdmin: () =>
    request<{ message: string; user: User; token?: string }>('/auth/elevate-admin', {
      method: 'POST',
    }),

  setRole: (role: 'admin' | 'user') =>
    request<{ message: string; user: User; token?: string }>('/auth/set-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
};
