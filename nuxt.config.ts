export default defineNuxtConfig({
  compatibilityDate: '2026-08-19',
  modules: ['@nuxtjs/supabase'],
  css: ['~/assets/site.css', '~/assets/interaction.css', '~/assets/legal-links.css'],
  devtools: { enabled: true },
  supabase: {
    redirect: false,
    useSsrCookies: true,
    types: '~/types/database.types.ts',
    cookieOptions: {
      maxAge: 60 * 60 * 8,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  nitro: {
    rollupConfig: {
      output: {
        manualChunks(id) {
          if (id.includes('@nuxtjs/supabase/dist/runtime/server/services')) return 'supabase-server'
        },
      },
    },
  },
})
