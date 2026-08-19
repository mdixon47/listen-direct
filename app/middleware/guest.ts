export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (loggedIn.value) {
    return navigateTo(user.value?.role === 'admin' ? '/admin' : '/dashboard')
  }
})
