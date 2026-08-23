export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/dashboard' && to.query.demo === '1') return

  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
