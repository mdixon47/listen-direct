export default defineNuxtConfig({
  compatibilityDate: '2026-08-19',
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/site.css', '~/assets/interaction.css', '~/assets/legal-links.css'],
  devtools: { enabled: true },
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 8,
    },
  },
})
