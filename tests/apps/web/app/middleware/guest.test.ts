import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { redirectPathSchema } from '../../../../../apps/web/app/utils/safe-redirect.ts';

type MiddlewareResult = undefined | { __redirect: string };
type RouteLike = { fullPath: string; query: Record<string, string> };
type RouteMiddlewareLike = (to: RouteLike, from: RouteLike) => Promise<MiddlewareResult>;

const useAuthMock = vi.fn();
const navigateToMock = vi.fn((to: string) => ({ __redirect: to }));

beforeEach(() => {
  vi.stubGlobal('defineNuxtRouteMiddleware', (handler: RouteMiddlewareLike) => handler);
  vi.stubGlobal('useAuth', useAuthMock);
  vi.stubGlobal('navigateTo', navigateToMock);
  // Real implementation, stubbed in as the global `redirectPathSchema.ts`
  // (a Nuxt utils auto-import) would provide — this keeps the middleware's
  // open-redirect guard exercised for real rather than faked away.
  vi.stubGlobal('redirectPathSchema', redirectPathSchema);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

async function importMiddleware(): Promise<RouteMiddlewareLike> {
  const mod = await import('../../../../../apps/web/app/middleware/guest.ts');
  // Same rationale as middleware/auth.test.ts: narrowed to the fields this
  // middleware actually reads instead of pulling in vue-router's types.
  return mod.default;
}

describe('guest route middleware', () => {
  it('lets a signed-out visitor through', async () => {
    useAuthMock.mockResolvedValue({ session: { value: undefined } });
    const middleware = await importMiddleware();

    const result = await middleware(
      { fullPath: '/signin', query: {} },
      { fullPath: '/signin', query: {} },
    );

    expect(result).toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it('redirects a signed-in visitor to /overview by default', async () => {
    useAuthMock.mockResolvedValue({ session: { value: { user: { id: 'user_1' } } } });
    const middleware = await importMiddleware();

    await middleware({ fullPath: '/signin', query: {} }, { fullPath: '/signin', query: {} });

    expect(navigateToMock).toHaveBeenCalledExactlyOnceWith('/overview');
  });

  it('redirects a signed-in visitor to the requested ?redirect target', async () => {
    useAuthMock.mockResolvedValue({ session: { value: { user: { id: 'user_1' } } } });
    const middleware = await importMiddleware();

    await middleware(
      { fullPath: '/signin?redirect=/settings/billing', query: { redirect: '/settings/billing' } },
      { fullPath: '/signin?redirect=/settings/billing', query: { redirect: '/settings/billing' } },
    );

    expect(navigateToMock).toHaveBeenCalledExactlyOnceWith('/settings/billing');
  });

  it('falls back to /overview for an off-site ?redirect target', async () => {
    useAuthMock.mockResolvedValue({ session: { value: { user: { id: 'user_1' } } } });
    const middleware = await importMiddleware();

    await middleware(
      { fullPath: '/signin', query: { redirect: '//evil.example.com' } },
      { fullPath: '/signin', query: { redirect: '//evil.example.com' } },
    );

    expect(navigateToMock).toHaveBeenCalledExactlyOnceWith('/overview');
  });
});
