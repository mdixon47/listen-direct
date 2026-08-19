export default defineNuxtRouteMiddleware(async () => {
  const supabaseUser = useSupabaseUser()
  if (!supabaseUser.value) return navigateTo('/login')

  const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
  const result = await $fetch<{ user: { role: 'demo' | 'user' | 'admin' } }>('/api/auth/me', { headers })
  if (result.user.role !== 'admin') return navigateTo('/dashboard')
})
