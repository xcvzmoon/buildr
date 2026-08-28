export default defineNuxtConfig({
  compatibilityDate: '2026-08-29',
  devtools: {
    enabled: true,
  },
  typescript: {
    typeCheck: true,
    strict: true,
  },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/ui'],
});
