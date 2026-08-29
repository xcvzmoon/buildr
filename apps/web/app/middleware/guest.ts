import * as v from 'valibot';

export default defineNuxtRouteMiddleware(async (to) => {
  const { session } = await useAuth();
  if (session.value) return navigateTo(v.parse(redirectPathSchema('/overview'), to.query.redirect));
});
