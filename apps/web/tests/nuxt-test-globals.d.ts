import type * as v from 'valibot';

type TestRoute = {
  fullPath: string;
  query: Record<string, string | undefined>;
};

declare function defineNuxtRouteMiddleware<T extends (to: TestRoute, from: TestRoute) => unknown>(
  handler: T,
): T;

declare function useAuth(): Promise<{ session: { value: unknown } }>;

declare function navigateTo<T>(target: T): T;

declare const redirectPathSchema: (fallback: string) => v.GenericSchema;
