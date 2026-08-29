// PS: this file gets the long-form comments other files don't. It's
// authentication, get it wrong here and kaboom every page in the app.
// Im here okay. This is me. This is your boy Mon 😜

import type { UseFetchOptions } from 'nuxt/app';

/**
 * Cache key for the session fetch below. Nuxt shares `useFetch` results by
 * key across every call site that reuses it within the same navigation, so
 * `useAuth()` calls from middleware, layouts, and pages all share one
 * request instead of firing three. That comes with a cost: the cached value
 * survives past the navigation it was fetched for. Anything that changes
 * the session (sign in, sign out) must call
 * `refreshNuxtData(SESSION_CACHE_KEY)` before navigating away, or the next
 * page's middleware reads stale data and bounces back.
 */
export const SESSION_CACHE_KEY = 'auth-session';

/**
 * SSR-safe session read and sign-out, built by hand because
 * `@nuxtjs/better-auth`'s own `useUserSession()` can't do this in
 * `clientOnly` mode. That mode has no local `/api/auth/**` route to hit
 * during SSR, so its session fetch silently fails on the server and every
 * page renders as signed out until the client hydrates. This composable
 * fetches the real session from apps/api through the proxy instead, so the
 * `auth`/`guest` route middleware see the correct state on the first
 * render.
 *
 * @returns The reactive session ref and a `signOut` function.
 */
export async function useAuth() {
  const { data: session } = await authClient.useSession(fetchAuthSession);

  /**
   * Fetcher passed to `authClient.useSession()`. During SSR, better-auth's
   * Vue client can't read `window` to build the request URL, so it falls
   * back to its default basePath (`/api/auth`) instead of ours
   * (`/api/v1/auth`). Rewriting the path here keeps the request relative,
   * which is what lets Nuxt forward the incoming request's cookies during
   * SSR. An absolute URL would skip that, and the session would never
   * resolve.
   *
   * @param url The URL better-auth's client wants to fetch.
   * @param options Fetch options from better-auth, forwarded to `useFetch`
   *   with `key` pinned to `SESSION_CACHE_KEY`.
   * @returns The `useFetch` result better-auth's client expects back.
   */
  function fetchAuthSession(
    url: string,
    options: UseFetchOptions<unknown>,
  ): ReturnType<typeof useFetch> {
    const correctedUrl = import.meta.server
      ? `/api/v1/auth${url.slice(url.lastIndexOf('/'))}`
      : url;

    return useFetch(correctedUrl, { ...options, key: SESSION_CACHE_KEY });
  }

  /**
   * Signs out and returns to `/signin`.
   *
   * Signs out through the module's own client, `useUserSession().signOut()`,
   * rather than the `authClient` above, so its reactive session state stays
   * in sync too. Nothing reads that state today, but it's a trap waiting for
   * whoever adds a component that does. Either client hits the same
   * endpoint, so the actual session cookie clears no matter which one makes
   * the call.
   *
   * Refreshes the cached session data before navigating. Without that,
   * `/signin`'s `guest` middleware would read the stale "still signed in"
   * cache and redirect straight back to the page we just left.
   */
  async function signOut(): Promise<void> {
    await useUserSession().signOut();
    await refreshNuxtData(SESSION_CACHE_KEY);
    await navigateTo('/signin');
  }

  return { session, signOut };
}
