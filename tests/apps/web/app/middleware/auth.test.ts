import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

type RedirectTarget = { path: string; query: { redirect: string } };
type MiddlewareResult = undefined | { __redirect: RedirectTarget };
type RouteLike = { fullPath: string };
type RouteMiddlewareLike = (to: RouteLike, from: RouteLike) => Promise<MiddlewareResult>;

const useAuthMock = vi.fn();
const navigateToMock = vi.fn((to: RedirectTarget) => ({ __redirect: to }));

beforeEach(() => {
  // `defineNuxtRouteMiddleware` is Nuxt's own registration wrapper — under
  // plain Vitest it just needs to hand back the handler it was given.
  vi.stubGlobal('defineNuxtRouteMiddleware', (handler: RouteMiddlewareLike) => handler);
  vi.stubGlobal('useAuth', useAuthMock);
  vi.stubGlobal('navigateTo', navigateToMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

async function importMiddleware(): Promise<RouteMiddlewareLike> {
  const mod = await import('../../../../../apps/web/app/middleware/auth.ts');
  // Nuxt's real `RouteMiddleware` type pulls in vue-router's route types,
  // which aren't resolvable outside apps/web's own tsconfig project; this
  // narrows to the one field (`fullPath`) the middleware actually reads.
  return mod.default;
}

const route = { fullPath: '/overview' };

describe('auth route middleware', () => {
  it('lets a signed-in visitor through', async () => {
    useAuthMock.mockResolvedValue({ session: { value: { user: { id: 'user_1' } } } });
    const middleware = await importMiddleware();

    const result = await middleware(route, route);

    expect(result).toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
  });

  it('redirects a signed-out visitor to /signin, preserving where they were headed', async () => {
    useAuthMock.mockResolvedValue({ session: { value: undefined } });
    const middleware = await importMiddleware();

    const result = await middleware(route, route);

    expect(navigateToMock).toHaveBeenCalledExactlyOnceWith({
      path: '/signin',
      query: { redirect: '/overview' },
    });
    expect(result).toEqual({ __redirect: { path: '/signin', query: { redirect: '/overview' } } });
  });
});
