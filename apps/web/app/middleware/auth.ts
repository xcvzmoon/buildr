export default defineNuxtRouteMiddleware(async (to) => {
  const { session } = await useAuth();
  if (!session.value) return navigateTo({ path: '/signin', query: { redirect: to.fullPath } });
});
