import { describe, expect, it, vi } from 'vite-plus/test';

const { createAuthClientMock, emailOTPClientMock } = vi.hoisted(() => ({
  createAuthClientMock: vi.fn(() => ({ __client: 'better-auth' })),
  emailOTPClientMock: vi.fn(() => ({ id: 'email-otp-client' })),
}));

vi.mock('better-auth/vue', () => ({ createAuthClient: createAuthClientMock }));
vi.mock('better-auth/client/plugins', () => ({ emailOTPClient: emailOTPClientMock }));

describe('authClient', () => {
  it('is created with the API v1 auth base path and the email OTP plugin', async () => {
    await import('../../../../../apps/web/app/utils/auth-client.ts');

    expect(emailOTPClientMock).toHaveBeenCalledOnce();
    expect(createAuthClientMock).toHaveBeenCalledExactlyOnceWith({
      basePath: '/api/v1/auth',
      plugins: [{ id: 'email-otp-client' }],
    });
  });
});
