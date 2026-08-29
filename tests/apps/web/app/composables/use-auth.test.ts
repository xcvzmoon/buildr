import type * as UseAuthModule from '../../../../../apps/web/app/composables/useAuth.ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type FetchAuthSessionFn = (url: string, options: Record<string, string>) => object;
type SessionLike = { value: unknown };

/**
 * `useAuth.ts` never imports Nuxt's `useFetch`/`navigateTo`/`refreshNuxtData`
 * or the sibling `authClient`/`useUserSession` — Nuxt's build-time
 * auto-import transform turns those free identifiers into real imports, but
 * that transform never runs under plain Vitest. Standard JS identifier
 * resolution still falls through to `globalThis` for an unbound name, so
 * `vi.stubGlobal` stands in for the auto-import here.
 */
const useSessionMock = vi.fn<(fetcher: FetchAuthSessionFn) => Promise<{ data: SessionLike }>>();
const useFetchMock = vi.fn();
const signOutMock = vi.fn();
const useUserSessionMock = vi.fn(() => ({ signOut: signOutMock }));
const refreshNuxtDataMock = vi.fn();
const navigateToMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('authClient', { useSession: useSessionMock });
  vi.stubGlobal('useFetch', useFetchMock);
  vi.stubGlobal('useUserSession', useUserSessionMock);
  vi.stubGlobal('refreshNuxtData', refreshNuxtDataMock);
  vi.stubGlobal('navigateTo', navigateToMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

async function importUseAuth(): Promise<typeof UseAuthModule> {
  return import('../../../../../apps/web/app/composables/useAuth.ts');
}

describe('SESSION_CACHE_KEY', () => {
  it('is a stable cache key', async () => {
    const { SESSION_CACHE_KEY } = await importUseAuth();
    expect(SESSION_CACHE_KEY).toBe('auth-session');
  });
});

describe('useAuth', () => {
  it('reads the session through authClient.useSession', async () => {
    const session: SessionLike = { value: { user: { id: 'user_1', email: 'jane@example.com' } } };
    useSessionMock.mockResolvedValue({ data: session });
    const { useAuth } = await importUseAuth();

    const result = await useAuth();

    expect(useSessionMock).toHaveBeenCalledOnce();
    expect(result.session).toBe(session);
  });

  it('routes the session fetch through useFetch, pinned to the shared cache key', async () => {
    useSessionMock.mockResolvedValue({ data: { value: undefined } });
    const { useAuth, SESSION_CACHE_KEY } = await importUseAuth();

    await useAuth();
    const fetchAuthSession = useSessionMock.mock.calls.at(0)?.[0];
    if (!fetchAuthSession) throw new Error('authClient.useSession was not called');
    fetchAuthSession('/api/auth/get-session', { credentials: 'include' });

    expect(useFetchMock).toHaveBeenCalledExactlyOnceWith('/api/auth/get-session', {
      credentials: 'include',
      key: SESSION_CACHE_KEY,
    });
  });

  describe('signOut', () => {
    it('signs out, invalidates the cached session, then redirects to /signin', async () => {
      useSessionMock.mockResolvedValue({ data: { value: undefined } });
      const { useAuth, SESSION_CACHE_KEY } = await importUseAuth();
      const { signOut } = await useAuth();

      await signOut();

      expect(signOutMock).toHaveBeenCalledOnce();
      expect(refreshNuxtDataMock).toHaveBeenCalledExactlyOnceWith(SESSION_CACHE_KEY);
      expect(navigateToMock).toHaveBeenCalledExactlyOnceWith('/signin');
    });

    it('refreshes the session cache before navigating away, not after', async () => {
      const callOrder: string[] = [];
      signOutMock.mockImplementation(() => {
        callOrder.push('signOut');
      });
      refreshNuxtDataMock.mockImplementation(() => {
        callOrder.push('refresh');
      });
      navigateToMock.mockImplementation(() => {
        callOrder.push('navigate');
      });
      useSessionMock.mockResolvedValue({ data: { value: undefined } });
      const { useAuth } = await importUseAuth();
      const { signOut } = await useAuth();

      await signOut();

      expect(callOrder).toEqual(['signOut', 'refresh', 'navigate']);
    });
  });
});
